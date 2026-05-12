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
} from "@knodia/common-models/ids";

import type {
  API_GetKnodeApiKeychainKeysQueryParams,
  API_KeychainKeySeed,
  API_KnodeApiKeychainSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { knodeApiKeychainNotFound } from "../models/errors.ts";
import {
  createKnodeApiKeychainCreatedV1Event,
  createKnodeApiKeychainKeyAddedV1Event,
} from "../models/knodeApiKeychainEventFactory.ts";
import {
  retrieveFlatKnodeApiKeychain,
  retrieveKeychainKey,
  retrieveKnodeApiKeychain,
} from "../utils/retrievalUtils.ts";
import { addKeyToKeychain } from "../utils/utils.ts";
import { assertOrganizationIsKeychainOwner } from "../utils/validators.ts";

export type KnodeApiKeychainService = ReturnType<
  typeof knodeApiKeychainServiceBuilder
>;

export function knodeApiKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
  config: { maxKeysPerKeychain: number },
) {
  return {
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
    async getKnodeApiKeychainKeys(
      knodeApiKeychainId: KnodeApiKeychainId,
      params: API_GetKnodeApiKeychainKeysQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<KeychainKey>> {
      logger.info(
        { params },
        `Getting keys of Knode API Keychain with ID ${knodeApiKeychainId}`,
      );

      const knodeApiKeychain =
        await readmodelService.getFlatKnodeApiKeychainById(knodeApiKeychainId);

      if (!knodeApiKeychain) {
        throw knodeApiKeychainNotFound(knodeApiKeychainId);
      }

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        knodeApiKeychain.data,
      );

      return await readmodelService.getKnodeApiKeychainKeys(
        knodeApiKeychainId,
        params,
      );
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
