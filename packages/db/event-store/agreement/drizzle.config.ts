import { drizzleKitConfig } from "@knodia/db-event-store-config/drizzleKitConfig";

import { eventStoreAgreementConfig } from "./config/config.ts";

export default {
  ...drizzleKitConfig(eventStoreAgreementConfig),
  schemaFilter: [eventStoreAgreementConfig.eventStoreDbAgreementSchema],
  tablesFilter: ["!flyway_schema_history_agreement"],
};
