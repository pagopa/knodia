import { drizzleConfig } from "@knodia/db-event-store-config/drizzleConfig";

import { eventStoreEserviceConfig } from "./config/config.ts";

const {
  eventStoreDbHost,
  eventStoreDbName,
  eventStoreDbPassword,
  eventStoreDbPort,
  eventStoreDbUser,
  eventStoreDbUseSsl,
} = eventStoreEserviceConfig;

export default drizzleConfig(
  {
    eventStoreDbHost,
    eventStoreDbName,
    eventStoreDbPassword,
    eventStoreDbPort,
    eventStoreDbUser,
    eventStoreDbUseSsl,
  },
  "./src/*.ts",
);
