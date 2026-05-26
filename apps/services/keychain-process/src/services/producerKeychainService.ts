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

import { generateId, type ProducerKeychainId } from "@knodia/common-models/ids";

import type {
  API_GetProducerKeychainsQueryParams,
  API_KeychainSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { createProducerKeychainCreatedV1Event } from "../models/consumerKeychainEventFactory.ts";
import { retrieveFlatProducerKeychain } from "../utils/retrievalUtils.ts";

export type ProducerKeychainService = ReturnType<
  typeof producerKeychainServiceBuilder
>;

export function producerKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
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
  };
}
