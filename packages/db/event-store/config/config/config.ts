import { env } from "node:process";
import { z } from "zod";

const EventStoreConfig = z
  .object({
    EVENTSTORE_DB_HOST: z.string().default("localhost"),
    EVENTSTORE_DB_NAME: z.string().default("root"),
    EVENTSTORE_DB_PASSWORD: z.string().default("root"),
    EVENTSTORE_DB_PORT: z.coerce
      .number()
      .int()
      .min(1024)
      .max(65535)
      .default(6001),
    EVENTSTORE_DB_USE_SSL: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    EVENTSTORE_DB_USER: z.string().default("root"),
  })
  .transform((c) => ({
    eventStoreDbHost: c.EVENTSTORE_DB_HOST,
    eventStoreDbName: c.EVENTSTORE_DB_NAME,
    eventStoreDbPassword: c.EVENTSTORE_DB_PASSWORD,
    eventStoreDbPort: c.EVENTSTORE_DB_PORT,
    eventStoreDbUser: c.EVENTSTORE_DB_USER,
    eventStoreDbUseSsl: c.EVENTSTORE_DB_USE_SSL,
  }));
export type EventStoreConfig = z.infer<typeof EventStoreConfig>;

export const eventStoreConfig: EventStoreConfig = EventStoreConfig.parse(env);
