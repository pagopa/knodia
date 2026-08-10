import { startServer } from "@knodia/fastify-zod-api-commons/startServer";

import { buildAppFromConfig } from "./app.ts";
import { config } from "./config/config.ts";

void startServer(buildAppFromConfig(config), {
  host: config.host,
  loggerConfig: config,
  port: config.port,
});
