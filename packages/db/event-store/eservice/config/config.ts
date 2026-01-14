import { EventStoreConfig } from "@knodia/db-event-store-config/config";
import { env } from "node:process";
import { z } from "zod";

const EventStoreEserviceConfig = EventStoreConfig.and(
  z
    .object({
      EVENTSTORE_DB_ESERVICE_SCHEMA: z.string().default("eservice"),
    })
    .transform((c) => ({
      eserviceSchema: c.EVENTSTORE_DB_ESERVICE_SCHEMA,
    })),
);
export type EventStoreEserviceConfig = z.infer<typeof EventStoreEserviceConfig>;

export const eventStoreEserviceConfig: EventStoreEserviceConfig =
  EventStoreEserviceConfig.parse(env);
