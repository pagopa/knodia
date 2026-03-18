import type { ConsumerKeychain } from "@knodia/keychain-models";

import { generateId } from "@knodia/common-models/ids";
import { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import { keychainEventStoreWriterBuilder } from "@knodia/db-event-store-writer/keychain";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import { createConsumerKeychainCreatedV1Event } from "../src/models/keychainEventFactory.ts";
import { app, eventStoreDb, keychainWriterService } from "./setup.ts";

export async function getAllKeychainEvents() {
  return await eventStoreDb.select().from(eventStoreKeychainEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);

export async function seedConsumerKeychain(consumerKeychain: ConsumerKeychain) {
  await keychainEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createConsumerKeychainCreatedV1Event(consumerKeychain, generateId()),
  );
  await keychainWriterService.upsertConsumerKeychain(consumerKeychain, 0);
}
