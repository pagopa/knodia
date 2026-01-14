import { drizzleConfig } from "@knodia/db-event-store-config/drizzleConfig";

import { eventStoreEserviceConfig } from "./config/config.ts";

export default drizzleConfig(eventStoreEserviceConfig, "./src/*.ts");
