import { env } from "node:process";
import { z } from "zod";

export const EventStoreConfig = z
  .object({
    EVENTSTORE_DB_POSTGRES_DB: z.string(),
    EVENTSTORE_DB_POSTGRES_DB_USE_SSL: z
      .enum(["true", "false"])
      .transform((v) => v === "true"),
    EVENTSTORE_DB_POSTGRES_HOST: z.string(),
    EVENTSTORE_DB_POSTGRES_PASSWORD: z.string(),
    EVENTSTORE_DB_POSTGRES_PORT: z.coerce.number().int().min(1024).max(65535),
    EVENTSTORE_DB_POSTGRES_USER: z.string(),
  })
  .transform((c) => ({
    db: c.EVENTSTORE_DB_POSTGRES_DB,
    host: c.EVENTSTORE_DB_POSTGRES_HOST,
    password: c.EVENTSTORE_DB_POSTGRES_PASSWORD,
    port: c.EVENTSTORE_DB_POSTGRES_PORT,
    user: c.EVENTSTORE_DB_POSTGRES_USER,
    useSsl: c.EVENTSTORE_DB_POSTGRES_DB_USE_SSL,
  }));
export type EventStoreConfig = z.infer<typeof EventStoreConfig>;

export const eventStoreConfig = EventStoreConfig.parse(env);
