import type { Producer } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";
import { noopRateLimiter } from "@knodia/fastify-zod-api-commons/rate-limit";

import { buildApp } from "../src/app.ts";
import { config } from "../src/config/config.ts";

// OpenAPI generation boots the app only to read its schema, so it must not
// open a Redis connection — pass the no-op limiter.
await generateOpenapi(
  buildApp({
    config,
    kafkaProducer: {} as Producer,
    rateLimiter: noopRateLimiter,
    signupDb: {} as NodePgDatabase,
  }),
);
