import { env } from "node:process";
import { z } from "zod";

export const EventStoreConfig = z
  .object({
    POSTGRES_DB: z.string().default("postgres"),
    POSTGRES_HOST: z.string().default("localhost"),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_PORT: z.string().default("5432"),
    POSTGRES_USER: z.string().default("postgres"),
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
