import { drizzleKitConfig } from "@knodia/db-event-store-config/drizzleKitConfig";

import { eventStoreConsumerKeychainConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(eventStoreConsumerKeychainConfig),
  schemaFilter: [
    eventStoreConsumerKeychainConfig.eventStoreDbConsumerKeychainSchema,
  ],
  tablesFilter: ["!flyway_schema_history"],
};
