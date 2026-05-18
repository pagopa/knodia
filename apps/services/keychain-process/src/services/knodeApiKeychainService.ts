/* eslint-disable max-lines-per-function */
import type { CognitoIdmClient, IdmUser } from "@knodia/cognito-idm-client";
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
  FlatKnodeApiKeychain,
  KeychainKey,
  KnodeApiKeychain,
} from "@knodia/keychain-models";

import {
  generateId,
  type KeyId,
  type KnodeApiKeychainId,
  type UserId,
} from "@knodia/common-models/ids";

import type {
  API_GetKnodeApiKeychainKeysQueryParams,
  API_GetKnodeApiKeychainMembersQueryParams,
  API_GetKnodeApiKeychainsQueryParams,
  API_KeychainKeySeed,
  API_KeychainMemberSeed,
  API_KnodeApiKeychainSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  createKnodeApiKeychainCreatedV1Event,
  createKnodeApiKeychainDeletedV1Event,
  createKnodeApiKeychainKeyAddedV1Event,
  createKnodeApiKeychainKeyRemovedV1Event,
  createKnodeApiKeychainMemberAddedV1Event,
  createKnodeApiKeychainMemberRemovedV1Event,
} from "../models/knodeApiKeychainEventFactory.ts";
import {
  retrieveFlatKnodeApiKeychain,
  retrieveKeychainKey,
  retrieveKeychainUser,
  retrieveKnodeApiKeychain,
} from "../utils/retrievalUtils.ts";
import {
  addKeyToKeychain,
  addMemberToKeychain,
  removeKeyFromKeychain,
  removeMemberFromKeychain,
} from "../utils/utils.ts";
import {
  assertOrganizationIsKeychainOwner,
  assertUserIsMemberOfKeychain,
} from "../utils/validators.ts";

export type KnodeApiKeychainService = ReturnType<
  typeof knodeApiKeychainServiceBuilder
>;

export function knodeApiKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
  cognitoIdmClient: CognitoIdmClient,
  config: { maxKeysPerKeychain: number },
) {
  return {
    async addKnodeApiKeychainMember(
      knodeApiKeychainId: KnodeApiKeychainId,
      member: API_KeychainMemberSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodeApiKeychain>> {
      logger.info(
        `Adding member ${member.userId} to Knode API Keychain ${knodeApiKeychainId}`,
      );

      const knodeApiKeychain = await retrieveKnodeApiKeychain(
        knodeApiKeychainId,
        readmodelService,
      );

      const { addedUserId, updatedKeychain: updatedKnodeApiKeychain } =
        await addMemberToKeychain(
          knodeApiKeychain.data,
          member,
          authData,
          cognitoIdmClient,
        );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodeApiKeychainMemberAddedV1Event(
          updatedKnodeApiKeychain,
          addedUserId,
          correlationId,
          knodeApiKeychain.metadata.version,
        ),
      );

      return {
        data: updatedKnodeApiKeychain,
        metadata: { version: newVersion },
      };
    },
    async createKnodeApiKeychain(
      seed: API_KnodeApiKeychainSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodeApiKeychain>> {
      const knodeApiKeychainId = generateId<KnodeApiKeychainId>();
      const { organizationId: ownerId } = authData;

      logger.info(
        `Creating Knode API Keychain ${knodeApiKeychainId} for owner ${ownerId}`,
      );

      const now = new Date();
      const knodeApiKeychain: KnodeApiKeychain = {
        createdAt: now,
        description: seed.description,
        id: knodeApiKeychainId,
        keys: [],
        name: seed.name,
        ownerId,
        updatedAt: now,
        users: [],
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodeApiKeychainCreatedV1Event(knodeApiKeychain, correlationId),
      );

      return {
        data: knodeApiKeychain,
        metadata: { version: newVersion },
      };
    },
    async deleteKnodeApiKeychain(
      knodeApiKeychainId: KnodeApiKeychainId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<void> {
      logger.info(`Deleting Knode API Keychain ${knodeApiKeychainId}`);

      const knodeApiKeychain = await retrieveKnodeApiKeychain(
        knodeApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        knodeApiKeychain.data,
      );

      await eventStoreWriter.insertEvent(
        createKnodeApiKeychainDeletedV1Event(
          knodeApiKeychain.data,
          correlationId,
          knodeApiKeychain.metadata.version,
        ),
      );
    },
    async getKnodeApiKeychain(
      knodeApiKeychainId: KnodeApiKeychainId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<WithMetadata<FlatKnodeApiKeychain>> {
      logger.info(`Getting Knode API Keychain with ID ${knodeApiKeychainId}`);

      return await retrieveFlatKnodeApiKeychain(
        knodeApiKeychainId,
        readmodelService,
      );
    },

    async getKnodeApiKeychainKey(
      knodeApiKeychainId: KnodeApiKeychainId,
      kid: KeyId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<KeychainKey> {
      logger.info(
        `Getting key with ID ${kid} of Knode API Keychain with ID ${knodeApiKeychainId}`,
      );

      const knodeApiKeychain = await retrieveKnodeApiKeychain(
        knodeApiKeychainId,
        readmodelService,
      );

      return retrieveKeychainKey(knodeApiKeychain.data, kid);
    },

    async getKnodeApiKeychainKeys(
      knodeApiKeychainId: KnodeApiKeychainId,
      params: API_GetKnodeApiKeychainKeysQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<KeychainKey>> {
      logger.info(
        { params },
        `Getting keys of Knode API Keychain with ID ${knodeApiKeychainId}`,
      );

      const knodeApiKeychain = await retrieveFlatKnodeApiKeychain(
        knodeApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        knodeApiKeychain.data,
      );

      return await readmodelService.getKnodeApiKeychainKeys(
        knodeApiKeychainId,
        params,
      );
    },

    async getKnodeApiKeychainMember(
      knodeApiKeychainId: KnodeApiKeychainId,
      userId: UserId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<IdmUser> {
      logger.info(
        `Getting member ${userId} of Knode API Keychain with id ${knodeApiKeychainId}`,
      );

      const knodeApiKeychain = await retrieveKnodeApiKeychain(
        knodeApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        knodeApiKeychain.data,
      );

      assertUserIsMemberOfKeychain(
        userId,
        knodeApiKeychainId,
        knodeApiKeychain.data.users,
      );

      return await retrieveKeychainUser(
        userId,
        knodeApiKeychainId,
        "Knode API Keychain",
        cognitoIdmClient,
      );
    },

    async getKnodeApiKeychainMembers(
      knodeApiKeychainId: KnodeApiKeychainId,
      params: API_GetKnodeApiKeychainMembersQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<IdmUser>> {
      logger.info(
        { params },
        `Getting members of Knode API Keychain with id ${knodeApiKeychainId}, with params`,
      );

      const { data: knodeApiKeychain } = await retrieveKnodeApiKeychain(
        knodeApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        knodeApiKeychain,
      );

      const paginatedUserIds = knodeApiKeychain.users
        .toSorted((a, b) => b.addedAt.getTime() - a.addedAt.getTime()) // Sort by addedAt desc
        .slice(params.offset, params.offset + params.limit);

      return {
        results: await Promise.all(
          paginatedUserIds.map(({ userId }) =>
            retrieveKeychainUser(
              userId,
              knodeApiKeychainId,
              "Knode API Keychain",
              cognitoIdmClient,
            ),
          ),
        ),
        totalCount: knodeApiKeychain.users.length,
      };
    },

    async getKnodeApiKeychains(
      params: API_GetKnodeApiKeychainsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<FlatKnodeApiKeychain>> {
      logger.info({ params }, "Getting Knode API keychains with params");

      return await readmodelService.getKnodeApiKeychains(params);
    },
    async removeKnodeApiKeychainKey(
      knodeApiKeychainId: KnodeApiKeychainId,
      kid: KeyId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodeApiKeychain>> {
      logger.info(
        `Removing key ${kid} from Knode API Keychain ${knodeApiKeychainId}`,
      );

      const knodeApiKeychain = await retrieveKnodeApiKeychain(
        knodeApiKeychainId,
        readmodelService,
      );

      const updatedKnodeApiKeychain = removeKeyFromKeychain(
        knodeApiKeychain.data,
        authData,
        kid,
      );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodeApiKeychainKeyRemovedV1Event(
          updatedKnodeApiKeychain,
          kid,
          correlationId,
          knodeApiKeychain.metadata.version,
        ),
      );

      return {
        data: updatedKnodeApiKeychain,
        metadata: { version: newVersion },
      };
    },

    async removeKnodeApiKeychainMember(
      knodeApiKeychainId: KnodeApiKeychainId,
      userId: UserId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodeApiKeychain>> {
      logger.info(
        `Removing member ${userId} from Knode API Keychain ${knodeApiKeychainId}`,
      );

      const knodeApiKeychain = await retrieveKnodeApiKeychain(
        knodeApiKeychainId,
        readmodelService,
      );

      const { updatedKeychain: updatedKnodeApiKeychain } =
        removeMemberFromKeychain(knodeApiKeychain.data, userId, authData);

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodeApiKeychainMemberRemovedV1Event(
          updatedKnodeApiKeychain,
          userId,
          correlationId,
          knodeApiKeychain.metadata.version,
        ),
      );

      return {
        data: updatedKnodeApiKeychain,
        metadata: { version: newVersion },
      };
    },
    async uploadKnodeApiKeychainKey(
      knodeApiKeychainId: KnodeApiKeychainId,
      keySeed: API_KeychainKeySeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KeychainKey>> {
      logger.info(`Uploading key to Knode API Keychain ${knodeApiKeychainId}`);

      const knodeApiKeychain = await retrieveKnodeApiKeychain(
        knodeApiKeychainId,
        readmodelService,
      );

      const { newKey, updatedKeychain: updatedKnodeApiKeychain } =
        await addKeyToKeychain(
          knodeApiKeychain.data,
          authData,
          keySeed,
          readmodelService,
          config.maxKeysPerKeychain,
        );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodeApiKeychainKeyAddedV1Event(
          updatedKnodeApiKeychain,
          newKey.kid,
          correlationId,
          knodeApiKeychain.metadata.version,
        ),
      );

      return {
        data: newKey,
        metadata: { version: newVersion },
      };
    },
  };
}
