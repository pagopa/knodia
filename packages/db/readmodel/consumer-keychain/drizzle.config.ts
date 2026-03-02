import { drizzleKitConfig } from "@knodia/db-readmodel-config/drizzleKitConfig";

import { readmodelConsumerKeychainConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(readmodelConsumerKeychainConfig),
  schemaFilter: [
    readmodelConsumerKeychainConfig.readmodelDbConsumerKeychainSchema,
  ],
  tablesFilter: ["!flyway_schema_history"],
};
