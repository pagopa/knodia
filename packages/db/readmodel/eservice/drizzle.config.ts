import { drizzleKitConfig } from "@knodia/db-readmodel-config/drizzleKitConfig";

import { readmodelEserviceConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(readmodelEserviceConfig),
  schemaFilter: [readmodelEserviceConfig.readmodelDbEserviceSchema],
  tablesFilter: ["!flyway_schema_history_eservice"],
};
