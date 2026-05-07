import { pgSchema } from "drizzle-orm/pg-core";

import { readmodelKeychainConfig } from "../config/config.ts";

export const keychainSchema = pgSchema(
  readmodelKeychainConfig.readmodelDbKeychainSchema,
);
