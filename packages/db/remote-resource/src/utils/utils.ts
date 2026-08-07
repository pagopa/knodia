import {
  type DbConnectionOptions,
  makeDrizzleConnection,
} from "@knodia/db-commons/utils";
import type { RemoteResourceDbConfig } from "../config.ts";

export type { DbConnectionOptions } from "@knodia/db-commons/utils";

export const makeRemoteResourceDrizzleConnection = (
  config: RemoteResourceDbConfig,
  options?: DbConnectionOptions,
) =>
  makeDrizzleConnection(
    {
      database: config.remoteResourceDbName,
      host: config.remoteResourceDbHost,
      password: config.remoteResourceDbPassword,
      port: config.remoteResourceDbPort,
      ssl: config.remoteResourceDbUseSsl
        ? { rejectUnauthorized: false }
        : undefined,
      user: config.remoteResourceDbUser,
    },
    "remote-resource",
    options,
  );
