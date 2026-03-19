import { drizzleKitConfig } from "@knodia/db-event-store-config/drizzleKitConfig";

import { eventStorePurposeConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(eventStorePurposeConfig),
  schemaFilter: [eventStorePurposeConfig.eventStoreDbPurposeSchema],
  tablesFilter: ["!flyway_schema_history"],
};
