import { defineConfig } from "drizzle-kit";

import { signalHubStoreDbConfig } from "./src/config/config.ts";

export default defineConfig({
  dbCredentials: {
    database: signalHubStoreDbConfig.signalHubStoreDbName,
    host: signalHubStoreDbConfig.signalHubStoreDbHost,
    password: signalHubStoreDbConfig.signalHubStoreDbPassword,
    port: signalHubStoreDbConfig.signalHubStoreDbPort,
    ssl: signalHubStoreDbConfig.signalHubStoreDbUseSsl,
    user: signalHubStoreDbConfig.signalHubStoreDbUser,
  },
  dialect: "postgresql",
  out: "./generated",
  schemaFilter: [
    signalHubStoreDbConfig.signalHubStoreDbSchema,
  ],
  tablesFilter: ["!flyway_schema_history"],
});
