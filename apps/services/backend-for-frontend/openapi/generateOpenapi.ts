import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";

import { buildApp } from "../src/app.ts";
import { config } from "../src/config/config.ts";

// Stub store for OpenAPI generation — no Redis connection needed
const noopStore = {
  consume: () => Promise.resolve(true),
  disconnect: () => Promise.resolve(),
};

await generateOpenapi(buildApp({ config, refreshTokenStore: noopStore }));
