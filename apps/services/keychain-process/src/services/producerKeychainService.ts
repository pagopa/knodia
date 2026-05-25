import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { ProducerKeychain } from "@knodia/keychain-models";

import { generateId, type ProducerKeychainId } from "@knodia/common-models/ids";

import type { API_ProducerKeychainSeed } from "../models/api.ts";

import { createProducerKeychainCreatedV1Event } from "../models/consumerKeychainEventFactory.ts";

export type ProducerKeychainService = ReturnType<
  typeof producerKeychainServiceBuilder
>;

export function producerKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
) {
  return {
    async createProducerKeychain(
      seed: API_ProducerKeychainSeed,
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
  };
}
