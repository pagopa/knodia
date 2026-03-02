import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dbCredentials: {
    database: process.env["RESOURCE_MANAGER_DB_NAME"] ?? "root",
    host: process.env["RESOURCE_MANAGER_DB_HOST"] ?? "localhost",
    password: process.env["RESOURCE_MANAGER_DB_PASSWORD"] ?? "root",
    port: Number(process.env["RESOURCE_MANAGER_DB_PORT"] ?? 6003),
    ssl: process.env["RESOURCE_MANAGER_DB_USE_SSL"] === "true",
    user: process.env["RESOURCE_MANAGER_DB_USER"] ?? "root",
  },
  dialect: "postgresql",
  out: "./generated",
  schemaFilter: [
    process.env["RESOURCE_MANAGER_DB_AGREEMENT_SCHEMA"] ?? "agreement",
  ],
  tablesFilter: ["!flyway_schema_history"],
});
