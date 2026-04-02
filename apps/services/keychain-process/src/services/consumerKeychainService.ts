/* eslint-disable max-lines-per-function */
import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { FastifyRequest } from "fastify";

import {
  type ExternalId,
  type ExternalResource,
} from "@knodia/common-models/externalResource";
import {
  type ConsumerKeychainId,
  generateId,
  type KnodeId,
  type PurposeId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";
import { getKnodiaServiceHeaders } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
  type FlatConsumerKeychain,
} from "@knodia/keychain-models";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";
import { match, P } from "ts-pattern";

import type {
  API_ConsumerKeychainPatch,
  API_ConsumerKeychainSeed,
  API_GetConsumerKeychainsQueryParams,
  API_KeychainMemberSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";
import type { UserService } from "./userService.ts";

import { userAlreadyMember, userNotFound } from "../models/errors.ts";
import {
  createConsumerKeychainCreatedV1Event,
  createConsumerKeychainDeletedV1Event,
  createConsumerKeychainMemberAddedV1Event,
  createConsumerKeychainMemberRemovedV1Event,
  createConsumerKeychainPurposeLinkedV1Event,
  createConsumerKeychainUpdatedV1Event,
} from "../models/keychainEventFactory.ts";
import { retrieveConsumerKeychain } from "../utils/readmodelUtils.ts";
import {
  assertOrganizationIsKeychainOwner,
  assertOrganizationIsPurposeConsumer,
  assertPurposeIsNotLinkedToConsumerKeychain,
  assertUserBelongsToOrganization,
  assertUserHasTechnicalRole,
  assertUserIsMemberOfKeychain,
} from "../utils/validators.ts";

export type ConsumerKeychainService = ReturnType<
  typeof consumerKeychainServiceBuilder
>;

export function consumerKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
  userService: UserService,
  remoteResourcesManagerClient: RemoteResourcesManagerClient,
) {
  return {
    async addConsumerKeychainMember(
      consumerKeychainId: ConsumerKeychainId,
      member: API_KeychainMemberSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychain>> {
      logger.info(
        `Adding member ${member.userId} to Consumer Keychain ${consumerKeychainId}`,
      );

      const consumerKeychain = await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        consumerKeychain.data,
      );

      const userId = unsafeBrandUserId(member.userId);

      if (consumerKeychain.data.users.includes(userId)) {
        throw userAlreadyMember(consumerKeychainId, userId);
      }

      const user = await userService.getUserById(userId);

      if (!user) {
        throw userNotFound(userId);
      }

      const userGroups = await userService.getUserGroups(user.username);

      assertUserBelongsToOrganization(
        userId,
        authData.organizationId,
        userGroups,
      );
      assertUserHasTechnicalRole(userId, userGroups);

      const updatedConsumerKeychain: ConsumerKeychain = {
        ...consumerKeychain.data,
        updatedAt: new Date(),
        users: [...consumerKeychain.data.users, user.id],
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainMemberAddedV1Event(
          updatedConsumerKeychain,
          user.id,
          correlationId,
          consumerKeychain.metadata.version,
        ),
      );

      return {
        data: updatedConsumerKeychain,
        metadata: { version: newVersion },
      };
    },
    async createConsumerKeychain(
      seed: API_ConsumerKeychainSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychain>> {
      const consumerKeychainId = generateId<ConsumerKeychainId>();

      const { organizationId: ownerId } = authData;

      logger.info(
        `Creating Consumer Keychain ${consumerKeychainId} for owner ${ownerId} `,
      );

      const now = new Date();

      const consumerKeychain: ConsumerKeychain = {
        createdAt: now,
        description: seed.description,
        id: consumerKeychainId,
        keys: [],
        name: seed.name,
        ownerId,
        updatedAt: now,
        users: [],
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainCreatedV1Event(consumerKeychain, correlationId),
      );

      return {
        data: consumerKeychain,
        metadata: { version: newVersion },
      };
    },
    async deleteConsumerKeychain(
      consumerKeychainId: ConsumerKeychainId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<void> {
      logger.info(`Deleting Consumer Keychain ${consumerKeychainId}`);

      const consumerKeychain = await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        consumerKeychain.data,
      );

      await eventStoreWriter.insertEvent(
        createConsumerKeychainDeletedV1Event(
          consumerKeychain.data,
          correlationId,
          consumerKeychain.metadata.version,
        ),
      );
    },

    async getConsumerKeychain(
      consumerKeychainId: ConsumerKeychainId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychain>> {
      logger.info(`Getting Consumer Keychain with ID ${consumerKeychainId}`);

      return await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );
    },

    async getConsumerKeychains(
      params: API_GetConsumerKeychainsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<FlatConsumerKeychain>> {
      logger.info({ params }, "Getting Consumer keychains with params");

      return await readmodelService.getConsumerKeychains(params);
    },

    async linkPurposeToConsumerKeychain(
      {
        consumerKeychainId,
        knodeId,
        purposeId,
        req,
      }: {
        consumerKeychainId: ConsumerKeychainId;
        knodeId: KnodeId;
        purposeId: ExternalId<PurposeId>;
        req: FastifyRequest;
      },
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychainPurpose>> {
      logger.info(
        `Linking Purpose ${purposeId} to Consumer Keychain ${consumerKeychainId}`,
      );

      const externalPurpose: ExternalResource<PurposeId> = {
        id: purposeId,
        knodeId,
      };
      const [consumerKeychain] = await Promise.all([
        retrieveConsumerKeychain(consumerKeychainId, readmodelService),
        assertPurposeIsNotLinkedToConsumerKeychain(
          consumerKeychainId,
          externalPurpose,
          readmodelService,
        ),
      ]);
      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        consumerKeychain.data,
      );

      const { data: purpose } = await remoteResourcesManagerApi.getPurpose({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { purposeId },
        query: { knodeId },
      });

      assertOrganizationIsPurposeConsumer(authData.organizationId, purpose);

      const linkedAt = new Date();
      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainPurposeLinkedV1Event({
          consumerKeychain: consumerKeychain.data,
          correlationId,
          currentMetadataVersion: consumerKeychain.metadata.version,
          linkedAt,
          purpose: externalPurpose,
        }),
      );

      return {
        data: {
          consumerKeychainId,
          linkedAt,
          purpose: externalPurpose,
        },
        metadata: { version: newVersion },
      };
    },

    async removeConsumerKeychainMember(
      consumerKeychainId: ConsumerKeychainId,
      userId: UserId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychain>> {
      logger.info(
        `Removing member ${userId} from Consumer Keychain ${consumerKeychainId}`,
      );

      const consumerKeychain = await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        consumerKeychain.data,
      );

      assertUserIsMemberOfKeychain(
        userId,
        consumerKeychainId,
        consumerKeychain.data.users,
      );

      const updatedConsumerKeychain: ConsumerKeychain = {
        ...consumerKeychain.data,
        updatedAt: new Date(),
        users: consumerKeychain.data.users.filter(
          (memberId) => memberId !== userId,
        ),
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainMemberRemovedV1Event(
          updatedConsumerKeychain,
          userId,
          correlationId,
          consumerKeychain.metadata.version,
        ),
      );

      return {
        data: updatedConsumerKeychain,
        metadata: { version: newVersion },
      };
    },

    async updateConsumerKeychain(
      consumerKeychainId: ConsumerKeychainId,
      update: API_ConsumerKeychainPatch,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychain>> {
      logger.info(`Updating Consumer Keychain ${consumerKeychainId}`);

      const consumerKeychain = await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        consumerKeychain.data,
      );

      const updatedConsumerKeychain: ConsumerKeychain = {
        ...consumerKeychain.data,
        description: match(update.description)
          .with(null, () => undefined)
          .with(undefined, () => consumerKeychain.data.description)
          .with(P.nonNullable, (desc) => desc)
          .exhaustive(),
        name: update.name ?? consumerKeychain.data.name,
        updatedAt: new Date(),
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainUpdatedV1Event(
          updatedConsumerKeychain,
          correlationId,
          consumerKeychain.metadata.version,
        ),
      );

      return {
        data: updatedConsumerKeychain,
        metadata: { version: newVersion },
      };
    },
  };
}
