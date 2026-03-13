import { drizzleKitConfig } from "@knodia/db-event-store-config/drizzleKitConfig";

import { eventStoreOrganizationConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(eventStoreOrganizationConfig),
  schemaFilter: [eventStoreOrganizationConfig.eventStoreDbOrganizationSchema],
  tablesFilter: ["!flyway_schema_history"],
};
