import { generateId, type OrganizationId } from "@knodia/common-models/ids";

import { createTestLogger } from "./logger.js";

// A simplified interface for a rate limiter that can be used with waitForHealthyLimiter().
// Created because of circular dependency issues between @knodia/test-commons and @knodia/fastify-zod-api-commons.
interface TestRateLimiter {
  consume(
    organizationId: OrganizationId,
    logger: ReturnType<typeof createTestLogger>["logger"],
  ): Promise<{
    degraded: boolean;
  }>;
}

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function waitForHealthyLimiter(
  rateLimiter: TestRateLimiter,
  testLogger: ReturnType<typeof createTestLogger>["logger"] = createTestLogger()
    .logger,
  organizationId: OrganizationId = generateId<OrganizationId>(),
): Promise<void> {
  let lastStatus: Awaited<ReturnType<TestRateLimiter["consume"]>> | undefined;

  for (let attempt = 0; attempt < 20; attempt++) {
    lastStatus = await rateLimiter.consume(organizationId, testLogger);
    if (!lastStatus.degraded) {
      return;
    }
    await delay(50);
  }

  throw new Error(
    `Redis rate limiter did not become healthy: ${JSON.stringify(lastStatus)}`,
  );
}
