import { assertDbConnection } from "@knodia/db-commons/utils";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { SignupDbConfig } from "../config.ts";

export const makeSignupDrizzleConnection = async (
  config: SignupDbConfig,
  options: { checkConnection?: boolean } = {},
): Promise<{ db: NodePgDatabase; pool: Pool }> => {
  const pool = new Pool({
    database: config.signupDbName,
    host: config.signupDbHost,
    password: config.signupDbPassword,
    port: config.signupDbPort,
    ssl: config.signupDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.signupDbUser,
  });

  if (options.checkConnection ?? true) {
    await assertDbConnection(pool, "signup");
  }

  return { db: drizzle(pool), pool };
};
