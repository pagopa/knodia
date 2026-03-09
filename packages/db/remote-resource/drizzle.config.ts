import { defineConfig } from "drizzle-kit";

import { remoteResourceDbConfig } from "./config/config.ts";

export default defineConfig({
  dbCredentials: {
    database: remoteResourceDbConfig.remoteResourceDbName,
    host: remoteResourceDbConfig.remoteResourceDbHost,
    password: remoteResourceDbConfig.remoteResourceDbPassword,
    port: remoteResourceDbConfig.remoteResourceDbPort,
    ssl: remoteResourceDbConfig.remoteResourceDbUseSsl,
    user: remoteResourceDbConfig.remoteResourceDbUser,
  },
  dialect: "postgresql",
  out: "./generated",
  schemaFilter: [remoteResourceDbConfig.remoteResourceDbAgreementSchema],
  tablesFilter: ["!flyway_schema_history"],
});
