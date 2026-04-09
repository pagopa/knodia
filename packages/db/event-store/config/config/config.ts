import { z } from "zod";

export const EventStoreConfig = z
  .object({
    EVENTSTORE_DB_HOST: z.string(),
    EVENTSTORE_DB_NAME: z.string(),
    EVENTSTORE_DB_PASSWORD: z.string(),
    EVENTSTORE_DB_PORT: z.coerce.number().int().min(1024).max(65535),
    EVENTSTORE_DB_USE_SSL: z.stringbool(),
    EVENTSTORE_DB_USER: z.string(),
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
