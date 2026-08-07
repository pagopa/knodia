import {
  type DbConnectionOptions,
  makeDrizzleConnection,
} from "@knodia/db-commons/utils";
import type { SignalHubDbConfig } from "../config/config.ts";

export type { DbConnectionOptions } from "@knodia/db-commons/utils";

export const makeSignalHubDrizzleConnection = (
  config: SignalHubDbConfig,
  options?: DbConnectionOptions,
) =>
  makeDrizzleConnection(
    {
      database: config.signalHubDbName,
      host: config.signalHubDbHost,
      password: config.signalHubDbPassword,
      port: config.signalHubDbPort,
      ssl: config.signalHubDbUseSsl ? { rejectUnauthorized: false } : undefined,
      user: config.signalHubDbUser,
    },
    "signal-hub",
    options,
  );
