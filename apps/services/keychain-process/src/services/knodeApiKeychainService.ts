import type { CognitoIdmClient } from "@knodia/cognito-idm-client";
import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
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
  unsafeBrandUserId,
} from "@knodia/common-models/ids";

import type {
  API_KeychainKeySeed,
  API_KeychainMemberSeed,
  API_KnodeApiKeychainSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { userAlreadyMember, userNotFound } from "../models/errors.ts";
import {
  createKnodeApiKeychainCreatedV1Event,
  createKnodeApiKeychainKeyAddedV1Event,
  createKnodeApiKeychainMemberAddedV1Event,
} from "../models/knodeApiKeychainEventFactory.ts";
import {
  retrieveFlatKnodeApiKeychain,
  retrieveKeychainKey,
  retrieveKnodeApiKeychain,
} from "../utils/retrievalUtils.ts";
import { addKeyToKeychain } from "../utils/utils.ts";
import {
  assertOrganizationIsKeychainOwner,
  assertUserBelongsToOrganization,
  assertUserHasTechnicalRole,
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

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        knodeApiKeychain.data,
      );

      const userId = unsafeBrandUserId(member.userId);

      if (knodeApiKeychain.data.users.some((user) => user.userId === userId)) {
        throw userAlreadyMember(knodeApiKeychainId, userId);
      }

      const user = await cognitoIdmClient.getUserById(userId);

      if (!user) {
        throw userNotFound(userId);
      }

      await assertUserBelongsToOrganization(
        user,
        authData.organizationId,
        cognitoIdmClient,
      );
      assertUserHasTechnicalRole(user);

      const now = new Date();
      const updatedKnodeApiKeychain: KnodeApiKeychain = {
        ...knodeApiKeychain.data,
        updatedAt: now,
        users: [
          ...knodeApiKeychain.data.users,
          { addedAt: now, userId: user.id },
        ],
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodeApiKeychainMemberAddedV1Event(
          updatedKnodeApiKeychain,
          user.id,
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
