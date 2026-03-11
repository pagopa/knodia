import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { ConsumerKeychain } from "@knodia/keychain-models";

import { type ConsumerKeychainId, generateId } from "@knodia/common-models/ids";

import type {
  API_ConsumerKeychainSeed,
  API_GetConsumerKeychainsQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  createConsumerKeychainCreatedV1Event,
  createConsumerKeychainDeletedV1Event,
} from "../models/keychainEventFactory.ts";
import { retrieveConsumerKeychain } from "../utils/readmodelUtils.ts";
import { assertOrganizationIsKeychainOwner } from "../utils/validators.ts";

export type ConsumerKeychainService = ReturnType<
  typeof consumerKeychainServiceBuilder
>;

export function consumerKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
    async createConsumerKeychain(
      seed: API_ConsumerKeychainSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ConsumerKeychain> {
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
    ): Promise<ConsumerKeychain> {
      logger.info(`Getting Consumer Keychain with ID ${consumerKeychainId}`);

      return (
        await retrieveConsumerKeychain(consumerKeychainId, readmodelService)
      ).data;
    },

    async getConsumerKeychains(
      params: API_GetConsumerKeychainsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<ConsumerKeychain>> {
      logger.info({ params }, "Getting Consumer keychains with params");

      return await readmodelService.getConsumerKeychains(params);
    },
  };
}
