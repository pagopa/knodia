import { defineConfig } from "drizzle-kit";

import { eventStoreConfig } from "./config/config.ts";

const { db, host, password, port, user, useSsl } = eventStoreConfig;

export default defineConfig({
  dbCredentials: {
    database: db,
    host,
    password,
    port,
    ssl: useSsl,
    user,
  },
  dialect: "postgresql",
  schema: "./src/*.ts",
});
