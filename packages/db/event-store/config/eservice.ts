import { env } from "node:process";
import { z } from "zod";

const EventStoreEserviceConfig = z
  .object({
    EVENTSTORE_DB_ESERVICE_SCHEMA: z.string().default("eservice"),
  })
  .transform((c) => ({
    schema: c.EVENTSTORE_DB_ESERVICE_SCHEMA,
  }));
export type EventStoreEserviceConfig = z.infer<typeof EventStoreEserviceConfig>;

export const eventStoreEserviceConfig: EventStoreEserviceConfig =
  EventStoreEserviceConfig.parse(env);
