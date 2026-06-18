import z from "zod";

export const RateLimiterConfig = z
  .object({
    RATE_LIMITER_AWS_IAM_CACHE_NAME: z.string().min(1).optional(),
    RATE_LIMITER_AWS_IAM_REGION: z.string().min(1).optional(),
    RATE_LIMITER_AWS_IAM_SERVERLESS: z.stringbool().default(false),
    RATE_LIMITER_AWS_IAM_USER_ID: z.string().min(1).optional(),
    RATE_LIMITER_DISABLE_AWS_IAM_AUTH: z.stringbool().default(false),
    RATE_LIMITER_MAX_REQUESTS: z.coerce.number().int().min(1),
    RATE_LIMITER_REDIS_HOST: z.string().min(1),
    RATE_LIMITER_REDIS_PORT: z.coerce.number().int().min(1).max(65535),
    RATE_LIMITER_TIME_WINDOW_SECONDS: z.coerce.number().int().min(1),
    RATE_LIMITER_TIMEOUT_SECONDS: z.coerce.number().int().min(1).default(2),
  })
  .refine(
    (c) =>
      c.RATE_LIMITER_DISABLE_AWS_IAM_AUTH ||
      (c.RATE_LIMITER_AWS_IAM_USER_ID !== undefined &&
        c.RATE_LIMITER_AWS_IAM_CACHE_NAME !== undefined &&
        c.RATE_LIMITER_AWS_IAM_REGION !== undefined),
    {
      message:
        "RATE_LIMITER_AWS_IAM_USER_ID, RATE_LIMITER_AWS_IAM_CACHE_NAME and RATE_LIMITER_AWS_IAM_REGION are required when IAM auth is enabled",
    },
  )
  .transform((c) => {
    // Re-narrows the IAM fields without `as string` casts; the `.refine`
    // above guarantees all three are present when IAM auth is enabled, so
    // this branch is just the type-system mirror of that check.
    const rateLimiterAwsIamAuth =
      c.RATE_LIMITER_DISABLE_AWS_IAM_AUTH ||
      c.RATE_LIMITER_AWS_IAM_USER_ID === undefined ||
      c.RATE_LIMITER_AWS_IAM_CACHE_NAME === undefined ||
      c.RATE_LIMITER_AWS_IAM_REGION === undefined
        ? undefined
        : {
            // ElastiCache lowercases cache names at creation; SigV4 must use
            // the lowercase form or the broker rejects AUTH.
            cacheName: c.RATE_LIMITER_AWS_IAM_CACHE_NAME.toLowerCase(),
            isServerless: c.RATE_LIMITER_AWS_IAM_SERVERLESS,
            region: c.RATE_LIMITER_AWS_IAM_REGION,
            userId: c.RATE_LIMITER_AWS_IAM_USER_ID,
          };
    return {
      rateLimiterAwsIamAuth,
      rateLimiterMaxRequests: c.RATE_LIMITER_MAX_REQUESTS,
      rateLimiterRedisHost: c.RATE_LIMITER_REDIS_HOST,
      rateLimiterRedisPort: c.RATE_LIMITER_REDIS_PORT,
      rateLimiterTimeoutSeconds: c.RATE_LIMITER_TIMEOUT_SECONDS,
      rateLimiterTimeWindowSeconds: c.RATE_LIMITER_TIME_WINDOW_SECONDS,
    };
  });
export type RateLimiterConfig = z.infer<typeof RateLimiterConfig>;
