import { env } from "node:process";
import { z } from "zod";

export const EventStoreConfig = z
  .object({
    POSTGRES_DB: z.string(),
    POSTGRES_HOST: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_PORT: z.string(),
    POSTGRES_USER: z.string(),
  })
  .transform((c) => ({
    postgresDb: c.POSTGRES_DB,
    postgresHost: c.POSTGRES_HOST,
    postgresPassword: c.POSTGRES_PASSWORD,
    postgresPort: c.POSTGRES_PORT,
    postgresUser: c.POSTGRES_USER,
  }));
export type EventStoreConfig = z.infer<typeof EventStoreConfig>;

export const eventStoreConfig = EventStoreConfig.parse(env);
