import { defineConfig } from "drizzle-kit";

import { signalHubDbConfig } from "./src/config/config.ts";

export default defineConfig({
  dbCredentials: {
    database: signalHubDbConfig.signalHubDbName,
    host: signalHubDbConfig.signalHubDbHost,
    password: signalHubDbConfig.signalHubDbPassword,
    port: signalHubDbConfig.signalHubDbPort,
    ssl: signalHubDbConfig.signalHubDbUseSsl,
    user: signalHubDbConfig.signalHubDbUser,
  },
  dialect: "postgresql",
  out: "./generated",
  schemaFilter: [signalHubDbConfig.signalHubDbSchema],
  tablesFilter: ["!flyway_schema_history"],
});
