import { drizzleKitConfig } from "@knodia/db-event-store-config/drizzleKitConfig";

import { eventStoreKeychainConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(eventStoreKeychainConfig),
  schemaFilter: [eventStoreKeychainConfig.eventStoreDbKeychainSchema],
  tablesFilter: ["!flyway_schema_history"],
};
