import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { ConsumerKeychain } from "@knodia/keychain-models";

import { type RequestContextData } from "@fastify/request-context";
import {
  type ConsumerKeychainId,
  generateId,
  OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";

import type {
  API_ConsumerKeychainSeed,
  API_GetConsumerKeychainsQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { consumerKeychainNotFound } from "../models/errors.ts";
import {
  createConsumerKeychainCreatedV1Event,
  createConsumerKeychainDeletedV1Event,
} from "../models/keychainEventFactory.ts";

export type ConsumerKeychainService = ReturnType<
  typeof consumerKeychainServiceBuilder
>;

export function consumerKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  const retrieveConsumerKeychain = async (
    consumerKeychainId: ConsumerKeychainId,
  ) => {
    const consumerKeychain =
      await readmodelService.getConsumerKeychainById(consumerKeychainId);

    if (!consumerKeychain) {
      throw consumerKeychainNotFound(consumerKeychainId);
    }

    return consumerKeychain;
  };

  return {
    async createConsumerKeychain(
      seed: API_ConsumerKeychainSeed,
      { correlationId, logger }: RequestContextData,
    ): Promise<ConsumerKeychain> {
      const consumerKeychainId = generateId<ConsumerKeychainId>();

      // TODO: get real ownerId from auth context
      const ownerId = unsafeBrandId<OrganizationId>(
        "00000000-0000-0000-0000-000000000000",
      );

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
        purposes: [],
        updatedAt: now,
        users: [],
      };

      await eventStoreWriter.insertEvent(
        createConsumerKeychainCreatedV1Event(consumerKeychain, correlationId),
      );

      return consumerKeychain;
    },
    async deleteConsumerKeychain(
      consumerKeychainId: ConsumerKeychainId,
      { correlationId, logger }: RequestContextData,
    ): Promise<void> {
      logger.info(`Deleting Consumer Keychain ${consumerKeychainId}`);

      const consumerKeychain =
        await retrieveConsumerKeychain(consumerKeychainId);

      await eventStoreWriter.insertEvent(
        createConsumerKeychainDeletedV1Event(
          consumerKeychain.data,
          correlationId,
          consumerKeychain.metadata.version,
        ),
      );
    },
    async getConsumerKeychains(
      params: API_GetConsumerKeychainsQueryParams,
      { logger }: RequestContextData,
    ): Promise<ListResult<ConsumerKeychain>> {
      logger.info({ params }, "Getting Consumer keychains with params");

      return await readmodelService.getConsumerKeychains(params);
    },
  };
}
