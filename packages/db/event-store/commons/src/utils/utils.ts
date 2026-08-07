import {
  type DbConnectionOptions,
  makeDrizzleConnection,
} from "@knodia/db-commons/utils";
import { type EventStoreConfig } from "@knodia/db-event-store-config/config";

export type { DbConnectionOptions } from "@knodia/db-commons/utils";

export const makeEventStoreDrizzleConnection = (
  config: EventStoreConfig,
  options?: DbConnectionOptions,
) =>
  makeDrizzleConnection(
    {
      database: config.eventStoreDbName,
      host: config.eventStoreDbHost,
      password: config.eventStoreDbPassword,
      port: config.eventStoreDbPort,
      ssl: config.eventStoreDbUseSsl ? { rejectUnauthorized: false } : undefined,
      user: config.eventStoreDbUser,
    },
    "event-store",
    options,
  );
