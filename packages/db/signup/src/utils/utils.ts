import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { SignupDbConfig } from "../config.ts";

/** @knipignore */
export const makeSignupDrizzleConnection = (
  config: SignupDbConfig,
): { db: NodePgDatabase; pool: Pool } => {
  const pool = new Pool({
    database: config.signupDbName,
    host: config.signupDbHost,
    password: config.signupDbPassword,
    port: config.signupDbPort,
    ssl: config.signupDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.signupDbUser,
  });

  return { db: drizzle(pool), pool };
};
