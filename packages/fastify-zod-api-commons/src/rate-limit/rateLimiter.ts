import type { KnodeId } from "@knodia/common-models/ids";
import type { FastifyBaseLogger } from "fastify";

import { Redis } from "ioredis";
import { match, P } from "ts-pattern";

import type { HTTPServiceName } from "../models/errors/services.ts";
import type { RateLimiterConfig } from "./config.ts";

export interface RateLimiter {
  consume(
    rateLimitKey: string,
    logger: FastifyBaseLogger,
  ): Promise<RateLimiterStatus>;
  disconnect(): Promise<void>;
  // Exposed for tests that need to clear shared ioredis-mock state across runs.
  readonly redis: Redis;
}

export interface RateLimiterStatus {
  // Fail-open mode (Redis unreachable). The numeric fields are meaningless
  // here and must not be reported to clients as real quota.
  degraded: boolean;
  limitReached: boolean;
  maxRequests: number;
  remainingRequests: number;
  resetMs: number;
}

interface InitRedisRateLimiterOptions {
  config: RateLimiterConfig;
  knodeId: KnodeId;
  logger: FastifyBaseLogger;
  serviceName: HTTPServiceName;
}

const extractIntegerReply = (
  reply: [Error | null, unknown] | undefined,
  label: string,
): number =>
  match(reply)
    .with([null, P.number], ([, n]) => n)
    .otherwise(() => {
      throw new Error(`Unexpected Redis result for ${label}`);
    });

// Eager connect: `lazyConnect: true` with `enableOfflineQueue: false` would
// reject the first command before auto-connect resolves.
export function initRedisRateLimiter({
  config,
  knodeId,
  logger,
  serviceName,
}: InitRedisRateLimiterOptions): RateLimiter {
  const namespace = `knodia-rate-limit:${knodeId}:${serviceName}:`;
  const maxRequests = config.rateLimiterMaxRequests;
  const rateIntervalMs = config.rateLimiterTimeWindowSeconds * 1_000;
  const commandTimeoutMs = config.rateLimiterTimeoutSeconds * 1_000;

  const redis = new Redis({
    commandTimeout: commandTimeoutMs,
    enableOfflineQueue: false,
    host: config.rateLimiterRedisHost,
    lazyConnect: false,
    maxRetriesPerRequest: 0,
    port: config.rateLimiterRedisPort,
    retryStrategy: (retries) => Math.min(retries * 1_000, 30_000),
  });

  redis.on("error", (err) => {
    logger.warn(
      `Redis rate-limiter error (host=${config.rateLimiterRedisHost} port=${config.rateLimiterRedisPort}): ${err.message}`,
    );
  });

  const failOpenStatus: RateLimiterStatus = Object.freeze({
    degraded: true,
    limitReached: false,
    maxRequests,
    remainingRequests: maxRequests,
    resetMs: rateIntervalMs,
  });

  return {
    async consume(rateLimitKey, logger): Promise<RateLimiterStatus> {
      const fullKey = `${namespace}${rateLimitKey}`;

      try {
        // PEXPIRE NX so concurrent requests in the same window don't reset TTL.
        const results = await redis
          .multi()
          .incr(fullKey)
          .pexpire(fullKey, rateIntervalMs, "NX")
          .pttl(fullKey)
          .exec();

        const count = extractIntegerReply(results?.[0], "INCR");
        // PEXPIRE NX is a Redis 7.0 syntax. If the server rejects the NX flag
        // (or the command otherwise errors at EXEC time), INCR has already
        // ticked the counter — DEL to avoid pinning the tenant at permanent
        // 429 with a key that has no TTL.
        const pexpireReply = results?.[1];
        if (pexpireReply && pexpireReply[0] !== null) {
          await redis.del(fullKey).catch(() => undefined);
          throw new Error(
            `PEXPIRE failed for ${fullKey}: ${pexpireReply[0].message}`,
          );
        }
        const pttl = extractIntegerReply(results?.[2], "PTTL");

        // PTTL <= 0 means the key has no TTL. The PEXPIRE-error branch above
        // covers the known cause; anything reaching here is unexpected, so
        // surface as degraded (and DEL the key) instead of silently masking
        // it behind a synthetic reset value.
        if (pttl <= 0) {
          logger.warn(
            `Rate-limit key has no TTL (pttl=${pttl}, key=${rateLimitKey}); failing open and resetting bucket`,
          );
          await redis.del(fullKey).catch(() => undefined);
          return failOpenStatus;
        }
        const resetMs = pttl;

        if (count > maxRequests) {
          logger.warn(
            `Rate limit reached for key=${rateLimitKey} (count=${count}, max=${maxRequests}, resetMs=${resetMs})`,
          );
          return {
            degraded: false,
            limitReached: true,
            maxRequests,
            remainingRequests: 0,
            resetMs,
          };
        }

        return {
          degraded: false,
          limitReached: false,
          maxRequests,
          remainingRequests: maxRequests - count,
          resetMs,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn(
          `Rate limiter degraded, allowing request through for key=${rateLimitKey}: ${message}`,
        );
        return failOpenStatus;
      }
    },
    // QUIT first so in-flight multi().exec() calls drain instead of being
    // rejected mid-flight and silently flipped to fail-open via the catch.
    // Then DISCONNECT to clear the reconnection timer the retry strategy
    // keeps scheduling; otherwise a client that never reached Redis (e.g.
    // OpenAPI generation in CI with no Redis) pins the event loop forever.
    disconnect: async () => {
      await redis.quit().catch(() => undefined);
      redis.disconnect();
    },
    redis,
  };
}
