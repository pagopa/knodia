import { startServer } from "@knodia/fastify-zod-api-commons/startServer";

import { buildAppFromConfig } from "./app.ts";
import { config } from "./config/config.ts";

void startServer(await buildAppFromConfig(config), {
  host: config.host,
  port: config.port,
});
