/* eslint-disable max-lines-per-function */
import type { CognitoIdmClient, IdmUser } from "@knodia/cognito-idm-client";
import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type {
  FlatProducerKeychain,
  ProducerKeychain,
} from "@knodia/keychain-models";

import {
  generateId,
  type ProducerKeychainId,
  type UserId,
} from "@knodia/common-models/ids";

import type {
  API_GetProducerKeychainMembersQueryParams,
  API_GetProducerKeychainsQueryParams,
  API_KeychainMemberSeed,
  API_KeychainSeed,
  API_ProducerKeychainPatch,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  createProducerKeychainCreatedV1Event,
  createProducerKeychainDeletedV1Event,
  createProducerKeychainMemberAddedV1Event,
  createProducerKeychainMemberRemovedV1Event,
  createProducerKeychainUpdatedV1Event,
} from "../models/producerKeychainEventFactory.ts";
import {
  retrieveFlatProducerKeychain,
  retrieveKeychainMember,
  retrievePaginatedKeychainUsers,
  retrieveProducerKeychain,
} from "../utils/retrievalUtils.ts";
import {
  addMemberToKeychain,
  removeMemberFromKeychain,
  updateKeychain,
} from "../utils/utils.ts";
import { assertOrganizationIsKeychainOwner } from "../utils/validators.ts";

export type ProducerKeychainService = ReturnType<
  typeof producerKeychainServiceBuilder
>;

export function producerKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
  cognitoIdmClient: CognitoIdmClient,
) {
  return {
    async addProducerKeychainMember(
      producerKeychainId: ProducerKeychainId,
      member: API_KeychainMemberSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<UserId>> {
      logger.info(
        `Adding member ${member.userId} to Producer Keychain ${producerKeychainId}`,
      );

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      const { addedUserId, updatedKeychain: updatedProducerKeychain } =
        await addMemberToKeychain(
          producerKeychain.data,
          member,
          authData,
          cognitoIdmClient,
        );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainMemberAddedV1Event(
          updatedProducerKeychain,
          addedUserId,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );

      return {
        data: addedUserId,
        metadata: { version: newVersion },
      };
    },
    async createProducerKeychain(
      seed: API_KeychainSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ProducerKeychain>> {
      const producerKeychainId = generateId<ProducerKeychainId>();

      const { organizationId: ownerId } = authData;

      logger.info(
        `Creating Producer Keychain ${producerKeychainId} for owner ${ownerId}`,
      );

      const now = new Date();

      const producerKeychain: ProducerKeychain = {
        createdAt: now,
        description: seed.description,
        id: producerKeychainId,
        keys: [],
        name: seed.name,
        ownerId,
        updatedAt: now,
        users: [],
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainCreatedV1Event(producerKeychain, correlationId),
      );

      return {
        data: producerKeychain,
        metadata: { version: newVersion },
      };
    },
    async deleteProducerKeychain(
      producerKeychainId: ProducerKeychainId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<void> {
      logger.info(`Deleting Producer Keychain ${producerKeychainId}`);

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        producerKeychain.data,
      );

      await eventStoreWriter.insertEvent(
        createProducerKeychainDeletedV1Event(
          producerKeychain.data,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );
    },
    async getProducerKeychain(
      producerKeychainId: ProducerKeychainId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<FlatProducerKeychain>> {
      logger.info(`Getting Producer Keychain with ID ${producerKeychainId}`);

      return await retrieveFlatProducerKeychain(
        producerKeychainId,
        readmodelService,
      );
    },
    async getProducerKeychainMember(
      producerKeychainId: ProducerKeychainId,
      userId: UserId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<IdmUser> {
      logger.info(
        `Getting member ${userId} of Producer Keychain with id ${producerKeychainId}`,
      );

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      return await retrieveKeychainMember({
        authData,
        cognitoIdmClient,
        keychain: producerKeychain.data,
        keychainKind: "Producer Keychain",
        userId,
      });
    },
    async getProducerKeychainMembers(
      producerKeychainId: ProducerKeychainId,
      params: API_GetProducerKeychainMembersQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<IdmUser>> {
      logger.info(
        { params },
        `Getting members of Producer Keychain with id ${producerKeychainId}, with params`,
      );

      const { data: producerKeychain } = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        producerKeychain,
      );

      return {
        results: await retrievePaginatedKeychainUsers({
          cognitoIdmClient,
          keychainId: producerKeychainId,
          keychainKind: "Producer Keychain",
          paginationParams: params,
          users: producerKeychain.users,
        }),
        totalCount: producerKeychain.users.length,
      };
    },
    async getProducerKeychains(
      params: API_GetProducerKeychainsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<FlatProducerKeychain>> {
      logger.info({ params }, "Getting Producer keychains with params");

      return await readmodelService.getProducerKeychains(params);
    },
    async removeProducerKeychainMember(
      producerKeychainId: ProducerKeychainId,
      userId: UserId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ProducerKeychain>> {
      logger.info(
        `Removing member ${userId} from Producer Keychain ${producerKeychainId}`,
      );

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      const { updatedKeychain: updatedProducerKeychain } =
        removeMemberFromKeychain(producerKeychain.data, userId, authData);

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainMemberRemovedV1Event(
          updatedProducerKeychain,
          userId,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );

      return {
        data: updatedProducerKeychain,
        metadata: { version: newVersion },
      };
    },
    async updateProducerKeychain(
      producerKeychainId: ProducerKeychainId,
      update: API_ProducerKeychainPatch,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ProducerKeychain>> {
      logger.info(`Updating Producer Keychain ${producerKeychainId}`);

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      const updatedProducerKeychain = updateKeychain(
        producerKeychain.data,
        update,
        authData,
      );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainUpdatedV1Event(
          updatedProducerKeychain,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );

      return {
        data: updatedProducerKeychain,
        metadata: { version: newVersion },
      };
    },
  };
}
