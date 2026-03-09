import { startServer } from "@knodia/fastify-zod-api-commons/startServer";

import { buildApp } from "./app.ts";
import { config } from "./config/config.ts";
import { createRefreshTokenStore } from "./services/refreshTokenStore.ts";

const refreshTokenStore = await createRefreshTokenStore(config.redisUrl);

void startServer(buildApp({ config, refreshTokenStore }), {
  host: config.host,
  port: config.port,
});
