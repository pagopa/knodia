import z from "zod";

export const RateLimiterConfig = z
  .object({
    RATE_LIMITER_MAX_REQUESTS: z.coerce.number().int().min(1),
    RATE_LIMITER_REDIS_HOST: z.string().min(1),
    RATE_LIMITER_REDIS_PORT: z.coerce.number().int().min(1).max(65535),
    RATE_LIMITER_TIME_WINDOW_SECONDS: z.coerce.number().int().min(1),
    RATE_LIMITER_TIMEOUT_SECONDS: z.coerce.number().int().min(1).default(2),
  })
  .transform((c) => ({
    rateLimiterMaxRequests: c.RATE_LIMITER_MAX_REQUESTS,
    rateLimiterRedisHost: c.RATE_LIMITER_REDIS_HOST,
    rateLimiterRedisPort: c.RATE_LIMITER_REDIS_PORT,
    rateLimiterTimeoutSeconds: c.RATE_LIMITER_TIMEOUT_SECONDS,
    rateLimiterTimeWindowSeconds: c.RATE_LIMITER_TIME_WINDOW_SECONDS,
  }));
export type RateLimiterConfig = z.infer<typeof RateLimiterConfig>;
