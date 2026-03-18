import { EventStoreConfig } from "@knodia/db-event-store-config/config";
import { env } from "node:process";
import { z } from "zod";

export const EventStorePurposeConfig = EventStoreConfig.and(
  z
    .object({
      EVENTSTORE_DB_PURPOSE_SCHEMA: z.string().default("purpose"),
    })
    .transform((c) => ({
      eventStoreDbPurposeSchema: c.EVENTSTORE_DB_PURPOSE_SCHEMA,
    })),
);
type EventStorePurposeConfig = z.infer<typeof EventStorePurposeConfig>;

export const eventStorePurposeConfig: EventStorePurposeConfig =
  EventStorePurposeConfig.parse(env);
