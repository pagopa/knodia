import { requestContext } from "@fastify/request-context";
import { type FastifyBaseLogger } from "fastify";

import { tooManyRequestsError } from "../models/errors/errors.ts";
import { type RateLimiter } from "./rateLimiter.ts";

export async function enforceRateLimit(
  rateLimiter: RateLimiter,
  rateLimitKey: string,
  logger: FastifyBaseLogger,
): Promise<void> {
  const status = await rateLimiter.consume(rateLimitKey, logger);
  requestContext.set("rateLimitStatus", status);
  if (status.limitReached) {
    throw tooManyRequestsError();
  }
}
