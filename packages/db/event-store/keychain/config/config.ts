import { EventStoreConfig } from "@knodia/db-event-store-config/config";
import { env } from "node:process";
import { z } from "zod";

export const EventStoreKeychainConfig = EventStoreConfig.and(
  z
    .object({
      EVENTSTORE_DB_KEYCHAIN_SCHEMA: z.string().default("keychain"),
    })
    .transform((c) => ({
      eventStoreDbKeychainSchema: c.EVENTSTORE_DB_KEYCHAIN_SCHEMA,
    })),
);
type EventStoreKeychainConfig = z.infer<typeof EventStoreKeychainConfig>;

export const eventStoreKeychainConfig: EventStoreKeychainConfig =
  EventStoreKeychainConfig.parse(env);
