import { defineConfig } from "drizzle-kit";

import { ReadModelConfig } from "../config/config.ts";

export const drizzleKitConfig = (
  {
    readModelDbHost,
    readModelDbName,
    readModelDbPassword,
    readModelDbPort,
    readModelDbUser,
    readModelDbUseSsl,
  }: ReadModelConfig,
  schemaPath = "./src/*.ts",
) =>
  defineConfig({
    dbCredentials: {
      database: readModelDbName,
      host: readModelDbHost,
      password: readModelDbPassword,
      port: readModelDbPort,
      ssl: readModelDbUseSsl,
      user: readModelDbUser,
    },
    dialect: "postgresql",
    out: "./generated",
    schema: schemaPath,
  });
