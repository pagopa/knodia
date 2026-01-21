import { drizzleKitConfig } from "@knodia/db-readmodel-config/drizzleKitConfig";

import { readModelEserviceConfig } from "./config/config.ts";

export default drizzleKitConfig(readModelEserviceConfig, "./src/*.ts");
