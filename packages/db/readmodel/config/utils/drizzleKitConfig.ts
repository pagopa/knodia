import { defineConfig } from "drizzle-kit";

import { ReadmodelConfig } from "../config/config.ts";

export const drizzleKitConfig = (
  {
    readmodelDbHost,
    readmodelDbName,
    readmodelDbPassword,
    readmodelDbPort,
    readmodelDbUser,
    readmodelDbUseSsl,
  }: ReadmodelConfig,
  schemaPath = "./src/*.ts",
) =>
  defineConfig({
    dbCredentials: {
      database: readmodelDbName,
      host: readmodelDbHost,
      password: readmodelDbPassword,
      port: readmodelDbPort,
      ssl: readmodelDbUseSsl,
      user: readmodelDbUser,
    },
    dialect: "postgresql",
    schema: schemaPath,
  });
