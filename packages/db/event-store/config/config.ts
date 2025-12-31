import { env } from "node:process";
import { z } from "zod";

export const EventStoreConfig = z
  .object({
    POSTGRES_USER: z.string().default("postgres"),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_HOST: z.string().default("localhost"),
    POSTGRES_PORT: z.string().default("5432"),
    POSTGRES_DB: z.string().default("postgres"),
  })
  .transform((c) => ({
    postgresUser: c.POSTGRES_USER,
    postgresPassword: c.POSTGRES_PASSWORD,
    postgresHost: c.POSTGRES_HOST,
    postgresPort: c.POSTGRES_PORT,
    postgresDb: c.POSTGRES_DB,
  }));
export type EventStoreConfig = z.infer<typeof EventStoreConfig>;

export const eventStoreConfig = EventStoreConfig.parse(env);
