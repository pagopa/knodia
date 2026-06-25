import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";
import { noopRateLimiter } from "@knodia/fastify-zod-api-commons/rate-limit";

import { buildAppFromConfig } from "../src/app.ts";
import { config } from "../src/config/config.ts";

await generateOpenapi(buildAppFromConfig(config, noopRateLimiter));
