import { initRedisRateLimiter } from "@knodia/fastify-zod-api-commons/rate-limit";
import { startServer } from "@knodia/fastify-zod-api-commons/startServer";
import { createLogger } from "@knodia/logger";

import { buildAppFromConfig } from "./app.ts";
import { config } from "./config/config.ts";

const rateLimiter = initRedisRateLimiter({
  config,
  knodeId: config.knodeId,
  logger: createLogger({ config }),
  serviceName: "authorization-server",
});

void startServer(buildAppFromConfig(config, rateLimiter), {
  host: config.host,
  port: config.port,
});
