import { defineConfig } from "drizzle-kit";

import { signupDbConfig } from "./src/config.ts";

export default defineConfig({
  dbCredentials: {
    database: signupDbConfig.signupDbName,
    host: signupDbConfig.signupDbHost,
    password: signupDbConfig.signupDbPassword,
    port: signupDbConfig.signupDbPort,
    ssl: signupDbConfig.signupDbUseSsl,
    user: signupDbConfig.signupDbUser,
  },
  dialect: "postgresql",
  out: "./generated",
  schemaFilter: [signupDbConfig.signupDbSchema],
  tablesFilter: ["!flyway_schema_history"],
});
