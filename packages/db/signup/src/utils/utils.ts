import {
  type DbConnectionOptions,
  makeDrizzleConnection,
} from "@knodia/db-commons/utils";
import type { SignupDbConfig } from "../config.ts";

export type { DbConnectionOptions } from "@knodia/db-commons/utils";

export const makeSignupDrizzleConnection = (
  config: SignupDbConfig,
  options?: DbConnectionOptions,
) =>
  makeDrizzleConnection(
    {
      database: config.signupDbName,
      host: config.signupDbHost,
      password: config.signupDbPassword,
      port: config.signupDbPort,
      ssl: config.signupDbUseSsl ? { rejectUnauthorized: false } : undefined,
      user: config.signupDbUser,
    },
    "signup",
    options,
  );
