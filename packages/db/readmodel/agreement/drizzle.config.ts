import { drizzleKitConfig } from "@knodia/db-readmodel-config/drizzleKitConfig";

import { readmodelAgreementConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(readmodelAgreementConfig),
  schemaFilter: [readmodelAgreementConfig.readmodelDbAgreementSchema],
  tablesFilter: ["!flyway_schema_history"],
};
