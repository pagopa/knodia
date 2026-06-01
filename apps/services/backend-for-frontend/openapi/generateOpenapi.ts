import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";
import { noopRateLimiter } from "@knodia/fastify-zod-api-commons/rate-limit";

import { buildAppFromConfig } from "../src/app.ts";
import { config } from "../src/config/config.ts";

// OpenAPI generation boots the app only to read its schema, so it must not
// open a Redis connection — pass the no-op limiter.
await generateOpenapi(buildAppFromConfig(config, undefined, noopRateLimiter));
