import { defineConfig } from "drizzle-kit";

import { eventStoreConfig } from "./config/config.ts";

const {
  postgresDb: db,
  postgresHost: host,
  postgresPassword: password,
  postgresPort: port,
  postgresUser: user,
} = eventStoreConfig;

export default defineConfig({
  dbCredentials: {
    url: `postgresql://${user}:${password}@${host}:${port}/${db}`,
  },
  dialect: "postgresql",
  schema: "./src/*.ts",
});
