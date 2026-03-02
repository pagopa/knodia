import { defineConfig } from "drizzle-kit";

import { resourceManagerDbConfig } from "./src/config/config.ts";

export default defineConfig({
  dbCredentials: {
    database: resourceManagerDbConfig.resourceManagerDbName,
    host: resourceManagerDbConfig.resourceManagerDbHost,
    password: resourceManagerDbConfig.resourceManagerDbPassword,
    port: resourceManagerDbConfig.resourceManagerDbPort,
    ssl: resourceManagerDbConfig.resourceManagerDbUseSsl,
    user: resourceManagerDbConfig.resourceManagerDbUser,
  },
  dialect: "postgresql",
  out: "./generated",
  schemaFilter: [resourceManagerDbConfig.resourceManagerDbAgreementSchema],
  tablesFilter: ["!flyway_schema_history"],
});
