import { drizzleKitConfig } from "@knodia/db-readmodel-config/drizzleKitConfig";

import { readmodelKeychainConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(readmodelKeychainConfig),
  schemaFilter: [readmodelKeychainConfig.readmodelDbKeychainSchema],
  tablesFilter: ["!flyway_schema_history"],
};
