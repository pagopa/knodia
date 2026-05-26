import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type {
  FlatProducerKeychain,
  KeychainKey,
  ProducerKeychain,
} from "@knodia/keychain-models";

import { generateId, type ProducerKeychainId } from "@knodia/common-models/ids";

import type {
  API_GetProducerKeychainsQueryParams,
  API_KeychainKeySeed,
  API_KeychainSeed,
  API_ProducerKeychainPatch,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  createProducerKeychainCreatedV1Event,
  createProducerKeychainDeletedV1Event,
  createProducerKeychainKeyAddedV1Event,
  createProducerKeychainUpdatedV1Event,
} from "../models/producerKeychainEventFactory.ts";
import {
  retrieveFlatProducerKeychain,
  retrieveProducerKeychain,
} from "../utils/retrievalUtils.ts";
import { addKeyToKeychain, updateKeychain } from "../utils/utils.ts";
import { assertOrganizationIsKeychainOwner } from "../utils/validators.ts";

export type ProducerKeychainService = ReturnType<
  typeof producerKeychainServiceBuilder
>;

export function producerKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
  config: { maxKeysPerKeychain: number },
) {
  return {
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
    async getProducerKeychains(
      params: API_GetProducerKeychainsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<FlatProducerKeychain>> {
      logger.info({ params }, "Getting Producer keychains with params");

      return await readmodelService.getProducerKeychains(params);
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
    async uploadProducerKeychainKey(
      producerKeychainId: ProducerKeychainId,
      keySeed: API_KeychainKeySeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KeychainKey>> {
      logger.info(`Uploading key to Producer Keychain ${producerKeychainId}`);

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      const { newKey, updatedKeychain: updatedProducerKeychain } =
        await addKeyToKeychain(
          producerKeychain.data,
          authData,
          keySeed,
          readmodelService,
          config.maxKeysPerKeychain,
        );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainKeyAddedV1Event(
          updatedProducerKeychain,
          newKey.kid,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );

      return {
        data: newKey,
        metadata: { version: newVersion },
      };
    },
  };
}
