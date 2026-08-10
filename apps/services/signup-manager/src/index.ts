import { initRedisRateLimiter } from "@knodia/fastify-zod-api-commons/rate-limit";
import { startServer } from "@knodia/fastify-zod-api-commons/startServer";
import { createLogger } from "@knodia/logger";

import { buildAppFromConfig } from "./app.ts";
import { config } from "./config/config.ts";

// signup-manager isn't tied to a specific Knode, so the limiter is built
// without a knodeId — its key namespace omits the knode segment.
const rateLimiter = initRedisRateLimiter({
  config,
  logger: createLogger({ config }),
  serviceName: "signup-manager",
});

void startServer(buildAppFromConfig(config, rateLimiter), {
  host: config.host,
  loggerConfig: config,
  port: config.port,
});
