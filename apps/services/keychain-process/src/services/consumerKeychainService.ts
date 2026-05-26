/* eslint-disable max-lines-per-function */
import type { CognitoIdmClient, IdmUser } from "@knodia/cognito-idm-client";
import type { ExternalResource } from "@knodia/common-models/externalResource";
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
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
  KeychainKey,
} from "@knodia/keychain-models";

import {
  type ConsumerKeychainId,
  generateId,
  type KeyId,
  type PurposeId,
  type UserId,
} from "@knodia/common-models/ids";
import { type KnodiaServiceHeaders } from "@knodia/fastify-zod-api-commons/models";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";
import { match, P } from "ts-pattern";

import type {
  API_ConsumerKeychainPatch,
  API_ConsumerKeychainSeed,
  API_GetConsumerKeychainKeysQueryParams,
  API_GetConsumerKeychainMembersQueryParams,
  API_GetConsumerKeychainPurposesQueryParams,
  API_GetConsumerKeychainsQueryParams,
  API_KeychainKeySeed,
  API_KeychainMemberSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  createConsumerKeychainCreatedV1Event,
  createConsumerKeychainDeletedV1Event,
  createConsumerKeychainKeyAddedV1Event,
  createConsumerKeychainKeyRemovedV1Event,
  createConsumerKeychainMemberAddedV1Event,
  createConsumerKeychainMemberRemovedV1Event,
  createConsumerKeychainPurposeLinkedV1Event,
  createConsumerKeychainPurposeUnlinkedV1Event,
  createConsumerKeychainUpdatedV1Event,
} from "../models/consumerKeychainEventFactory.ts";
import { keychainMemberNotFound } from "../models/errors.ts";
import {
  retrieveConsumerKeychain,
  retrieveConsumerKeychainPurpose,
  retrieveFlatConsumerKeychain,
  retrieveKeychainKey,
  retrieveKeychainUser,
} from "../utils/retrievalUtils.ts";
import {
  addKeyToKeychain,
  addMemberToKeychain,
  removeKeyFromKeychain,
  removeMemberFromKeychain,
} from "../utils/utils.ts";
import {
  assertOrganizationIsKeychainOwner,
  assertOrganizationIsPurposeConsumer,
  assertPurposeIsNotLinkedToConsumerKeychain,
  assertUserIsMemberOfKeychain,
} from "../utils/validators.ts";

export type ConsumerKeychainService = ReturnType<
  typeof consumerKeychainServiceBuilder
>;

export function consumerKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
  cognitoIdmClient: CognitoIdmClient,
  remoteResourcesManagerClient: RemoteResourcesManagerClient,
  config: { maxKeysPerKeychain: number },
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

      const { addedUserId, updatedKeychain: updatedConsumerKeychain } =
        await addMemberToKeychain(
          consumerKeychain.data,
          member,
          authData,
          cognitoIdmClient,
        );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainMemberAddedV1Event(
          updatedConsumerKeychain,
          addedUserId,
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
        `Creating Consumer Keychain ${consumerKeychainId} for owner ${ownerId}`,
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
    ): Promise<WithMetadata<FlatConsumerKeychain>> {
      logger.info(`Getting Consumer Keychain with ID ${consumerKeychainId}`);

      return await retrieveFlatConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );
    },

    async getConsumerKeychainKey(
      consumerKeychainId: ConsumerKeychainId,
      kid: KeyId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<KeychainKey> {
      logger.info(
        `Getting key with ID ${kid} of Consumer Keychain with ID ${consumerKeychainId}`,
      );

      const consumerKeychain = await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      return retrieveKeychainKey(consumerKeychain.data, kid);
    },

    async getConsumerKeychainKeys(
      consumerKeychainId: ConsumerKeychainId,
      params: API_GetConsumerKeychainKeysQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<KeychainKey>> {
      logger.info(
        { params },
        `Getting keys of Consumer Keychain with ID ${consumerKeychainId}`,
      );

      const consumerKeychain = await retrieveFlatConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        consumerKeychain.data,
      );

      return await readmodelService.getConsumerKeychainKeys(
        consumerKeychainId,
        params,
      );
    },

    async getConsumerKeychainMember(
      consumerKeychainId: ConsumerKeychainId,
      userId: UserId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<IdmUser> {
      logger.info(
        `Getting member ${userId} of Consumer Keychain with id ${consumerKeychainId}`,
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

      const member = await retrieveKeychainUser(userId, cognitoIdmClient);
      if (!member) {
        throw keychainMemberNotFound(consumerKeychainId, userId);
      }
      return member;
    },

    async getConsumerKeychainMembers(
      consumerKeychainId: ConsumerKeychainId,
      params: API_GetConsumerKeychainMembersQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<IdmUser>> {
      logger.info(
        { params },
        `Getting members of Consumer Keychain with id ${consumerKeychainId}, with params`,
      );

      const { data: consumerKeychain } = await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        consumerKeychain,
      );

      const sortedUserIds = consumerKeychain.users.toSorted(
        (a, b) => b.addedAt.getTime() - a.addedAt.getTime(),
      );

      const activeMembers = (
        await Promise.all(
          sortedUserIds.map(({ userId }) =>
            retrieveKeychainUser(userId, cognitoIdmClient),
          ),
        )
      ).filter((member): member is IdmUser => member !== undefined);

      return {
        results: activeMembers.slice(
          params.offset,
          params.offset + params.limit,
        ),
        totalCount: activeMembers.length,
      };
    },

    async getConsumerKeychainPurpose(
      consumerKeychainId: ConsumerKeychainId,
      purpose: ExternalResource<PurposeId>,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychainPurpose>> {
      logger.info(
        `Getting purpose ${purpose.id} (knode ${purpose.knodeId}) linked to Consumer Keychain ${consumerKeychainId}`,
      );

      await retrieveConsumerKeychain(consumerKeychainId, readmodelService);

      return await retrieveConsumerKeychainPurpose(
        { consumerKeychainId, purpose },
        readmodelService,
      );
    },

    async getConsumerKeychainPurposes(
      consumerKeychainId: ConsumerKeychainId,
      params: API_GetConsumerKeychainPurposesQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<ConsumerKeychainPurpose>> {
      logger.info(
        { params },
        `Getting Purposes linked to Consumer Keychain ${consumerKeychainId} with params`,
      );

      await retrieveConsumerKeychain(consumerKeychainId, readmodelService);

      return await readmodelService.getConsumerKeychainPurposes(
        consumerKeychainId,
        params,
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
        consumerKeychainPurpose,
        headers,
      }: {
        consumerKeychainPurpose: Omit<ConsumerKeychainPurpose, "linkedAt">;
        headers: KnodiaServiceHeaders;
      },
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychainPurpose>> {
      const { consumerKeychainId, purpose: externalPurpose } =
        consumerKeychainPurpose;
      logger.info(
        `Linking Purpose ${externalPurpose.id} owned by Knode ${externalPurpose.knodeId} to Consumer Keychain ${consumerKeychainId}`,
      );

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
        headers,
        path: { purposeId: externalPurpose.id },
        query: { knodeId: externalPurpose.knodeId },
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

    async removeConsumerKeychainKey(
      consumerKeychainId: ConsumerKeychainId,
      kid: KeyId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychain>> {
      logger.info(
        `Removing key ${kid} from Consumer Keychain ${consumerKeychainId}`,
      );

      const consumerKeychain = await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      const updatedConsumerKeychain = removeKeyFromKeychain(
        consumerKeychain.data,
        authData,
        kid,
      );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainKeyRemovedV1Event(
          updatedConsumerKeychain,
          kid,
          correlationId,
          consumerKeychain.metadata.version,
        ),
      );

      return {
        data: updatedConsumerKeychain,
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

      const { updatedKeychain: updatedConsumerKeychain } =
        removeMemberFromKeychain(consumerKeychain.data, userId, authData);

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

    async unlinkPurposeFromConsumerKeychain(
      requestParams: Omit<ConsumerKeychainPurpose, "linkedAt">,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychainPurpose>> {
      const { consumerKeychainId, purpose } = requestParams;
      logger.info(
        `Unlinking Purpose ${purpose.id} owned by Knode ${purpose.knodeId} from Consumer Keychain ${consumerKeychainId}`,
      );

      const [consumerKeychain, consumerKeychainPurpose] = await Promise.all([
        retrieveConsumerKeychain(consumerKeychainId, readmodelService),
        retrieveConsumerKeychainPurpose(
          {
            consumerKeychainId,
            purpose,
          },
          readmodelService,
        ),
      ]);
      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        consumerKeychain.data,
      );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainPurposeUnlinkedV1Event({
          consumerKeychain: consumerKeychain.data,
          correlationId,
          currentMetadataVersion: consumerKeychain.metadata.version,
          purpose,
        }),
      );
      return {
        data: consumerKeychainPurpose.data,
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
    async uploadConsumerKeychainKey(
      consumerKeychainId: ConsumerKeychainId,
      keySeed: API_KeychainKeySeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KeychainKey>> {
      logger.info(`Uploading key to Consumer Keychain ${consumerKeychainId}`);

      const consumerKeychain = await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      const { newKey, updatedKeychain: updatedConsumerKeychain } =
        await addKeyToKeychain(
          consumerKeychain.data,
          authData,
          keySeed,
          readmodelService,
          config.maxKeysPerKeychain,
        );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainKeyAddedV1Event(
          updatedConsumerKeychain,
          newKey.kid,
          correlationId,
          consumerKeychain.metadata.version,
        ),
      );

      return {
        data: newKey,
        metadata: { version: newVersion },
      };
    },
  };
}
