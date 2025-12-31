import { defineConfig } from "drizzle-kit";
import { eventStoreConfig } from "./config/config.ts";

const {
  postgresUser: user,
  postgresPassword: password,
  postgresHost: host,
  postgresPort: port,
  postgresDb: db,
} = eventStoreConfig;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/*.ts",
  dbCredentials: {
    url: `postgresql://${user}:${password}@${host}:${port}/${db}`,
  },
});
