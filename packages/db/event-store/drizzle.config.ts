import { defineConfig } from "drizzle-kit";

import { eventStoreConfig } from "./config/config.ts";

const {
  eventStoreDbHost: host,
  eventStoreDbName: db,
  eventStoreDbPassword: password,
  eventStoreDbPort: port,
  eventStoreDbUser: user,
  eventStoreDbUseSsl: useSsl,
} = eventStoreConfig;

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
