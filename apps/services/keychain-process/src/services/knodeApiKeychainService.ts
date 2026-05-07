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
  type OrganizationId,
} from "@knodia/common-models/ids";

import type { API_KnodeApiKeychainSeed } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { createKnodeApiKeychainCreatedV1Event } from "../models/knodeApiKeychainEventFactory.ts";
import {
  retrieveFlatKnodeApiKeychain,
  retrieveKnodeApiKeychain,
  retrieveKnodeApiKeychainKey,
} from "../utils/retrievalUtils.ts";

export type KnodeApiKeychainService = ReturnType<
  typeof knodeApiKeychainServiceBuilder
>;

export function knodeApiKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
    async createKnodeApiKeychain(
      seed: API_KnodeApiKeychainSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodeApiKeychain>> {
      const knodeApiKeychainId = generateId<KnodeApiKeychainId>();
      const ownerId: OrganizationId = authData.organizationId;

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

      return retrieveKnodeApiKeychainKey(knodeApiKeychain.data, kid);
    },
  };
}
