import { drizzleKitConfig } from "@knodia/db-readmodel-config/drizzleKitConfig";

import { readmodelOrganizationConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(readmodelOrganizationConfig),
  schemaFilter: [readmodelOrganizationConfig.readmodelDbOrganizationSchema],
  tablesFilter: ["!flyway_schema_history"],
};
