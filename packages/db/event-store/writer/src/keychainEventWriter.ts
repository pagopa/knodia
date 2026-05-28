import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
  ProducerKeychainId,
} from "@knodia/common-models/ids";
import type { KeychainEventV1 } from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";

import {
  eventStoreWriterBuilder,
  type NewEventStoreEvent,
} from "./eventWriter.ts";

export type KeychainEventStoreWriter = ReturnType<
  typeof keychainEventStoreWriterBuilder
>;
export type NewEventStoreKeychainEvent = NewEventStoreEvent<
  KeychainEventV1,
  ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId
>;

export const keychainEventStoreWriterBuilder = (db: NodePgDatabase) =>
  eventStoreWriterBuilder({
    db,
    eventsTable: eventStoreKeychainEvents,
  });
