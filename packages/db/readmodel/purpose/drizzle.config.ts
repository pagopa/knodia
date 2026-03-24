import { drizzleKitConfig } from "@knodia/db-readmodel-config/drizzleKitConfig";

import { readmodelPurposeConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(readmodelPurposeConfig),
  schemaFilter: [readmodelPurposeConfig.readmodelDbPurposeSchema],
  tablesFilter: ["!flyway_schema_history"],
};
