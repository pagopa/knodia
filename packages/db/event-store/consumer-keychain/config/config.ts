import { EventStoreConfig } from "@knodia/db-event-store-config/config";
import { env } from "node:process";
import { z } from "zod";

export const EventStoreConsumerKeychainConfig = EventStoreConfig.and(
  z
    .object({
      EVENTSTORE_DB_CONSUMER_KEYCHAIN_SCHEMA: z
        .string()
        .default("consumer_keychain"),
    })
    .transform((c) => ({
      eventStoreDbConsumerKeychainSchema:
        c.EVENTSTORE_DB_CONSUMER_KEYCHAIN_SCHEMA,
    })),
);
type EventStoreConsumerKeychainConfig = z.infer<
  typeof EventStoreConsumerKeychainConfig
>;

export const eventStoreConsumerKeychainConfig: EventStoreConsumerKeychainConfig =
  EventStoreConsumerKeychainConfig.parse(env);
