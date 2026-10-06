import {
  type DbConnectionOptions,
  makeDrizzleConnection,
} from "@knodia/db-commons/utils";

import type { SignalHubDbConfig } from "../config/config.ts";

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
      user: config.signalHubDbUser,
      useSsl: config.signalHubDbUseSsl,
    },
    options,
  );
