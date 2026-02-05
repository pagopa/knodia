import { drizzleKitConfig } from "@knodia/db-event-store-config/drizzleKitConfig";

import { eventStoreEserviceConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(eventStoreEserviceConfig, "./src/*.ts"),
  schemaFilter: [eventStoreEserviceConfig.eventStoreDbEserviceSchema],
  tablesFilter: ["!flyway_schema_history"],
};
