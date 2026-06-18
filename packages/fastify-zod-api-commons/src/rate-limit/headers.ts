// Single source of truth for rate-limit headers, shared between runtime
// (middleware + onResponseHook) and the OpenAPI generator.

interface RateLimitHeader {
  httpName: string;
  openapiComponentName: string;
  openapiName: string;
}

export const RATE_LIMIT_HEADERS = {
  limit: {
    httpName: "x-ratelimit-limit",
    openapiComponentName: "RateLimitLimit",
    openapiName: "X-RateLimit-Limit",
  },
  remaining: {
    httpName: "x-ratelimit-remaining",
    openapiComponentName: "RateLimitRemaining",
    openapiName: "X-RateLimit-Remaining",
  },
  reset: {
    httpName: "x-ratelimit-reset",
    openapiComponentName: "RateLimitReset",
    openapiName: "X-RateLimit-Reset",
  },
  retryAfter: {
    httpName: "retry-after",
    openapiComponentName: "RateLimitRetryAfter",
    openapiName: "Retry-After",
  },
} as const satisfies Record<string, RateLimitHeader>;
