import { defineConfig } from "drizzle-kit";

import { EventStoreConfig } from "../config/config.ts";

export const drizzleKitConfig = (
  {
    eventStoreDbHost,
    eventStoreDbName,
    eventStoreDbPassword,
    eventStoreDbPort,
    eventStoreDbUser,
    eventStoreDbUseSsl,
  }: EventStoreConfig,
  schemaPath = "./src/*.ts",
) =>
  defineConfig({
    dbCredentials: {
      database: eventStoreDbName,
      host: eventStoreDbHost,
      password: eventStoreDbPassword,
      port: eventStoreDbPort,
      ssl: eventStoreDbUseSsl,
      user: eventStoreDbUser,
    },
    dialect: "postgresql",
    out: "./generated",
    schema: schemaPath,
  });
