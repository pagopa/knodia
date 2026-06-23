import type { FastifyInstance } from "fastify";

import { KnodeId } from "@knodia/common-models/ids";
import {
  initRedisRateLimiter,
  type RateLimiterConfig,
} from "@knodia/fastify-zod-api-commons/rate-limit";
import { createTestLogger } from "@knodia/test-commons/utils";
import { afterAll, beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

export let app: FastifyInstance;

export const TEST_KNODE_ID = KnodeId.enum.Orion;

const { logger, loggerConfig } = createTestLogger();
const rateLimiterConfig: RateLimiterConfig = {
  rateLimiterAwsIamAuth: undefined,
  rateLimiterEnvironment: "test",
  rateLimiterMaxRequests: 200,
  rateLimiterRedisHost: process.env["RATE_LIMITER_REDIS_HOST"] ?? "127.0.0.1",
  rateLimiterRedisPort: Number(process.env["RATE_LIMITER_REDIS_PORT"] ?? 6379),
  rateLimiterTimeoutSeconds: 2,
  rateLimiterTimeWindowSeconds: 60,
};

beforeAll(async () => {
  // k2o-gateway tests assert non-degraded X-RateLimit headers, so they need
  // the real Redis-backed limiter (against the test container), not the no-op.
  const rateLimiter = initRedisRateLimiter({
    config: rateLimiterConfig,
    knodeId: TEST_KNODE_ID,
    logger,
    serviceName: "k2o-gateway",
  });

  app = buildApp({
    config: {
      ...loggerConfig,
      acceptedAudiences: ["test-audience"],
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    keychainProcessUrl: "http://localhost:0",
    rateLimiter,
  });

  await app.ready();
});

afterAll(async () => {
  await app.close();
});
