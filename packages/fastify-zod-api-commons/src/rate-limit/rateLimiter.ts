import type { ExternalId } from "@knodia/common-models/externalResource";
import type { KnodeId, OrganizationId } from "@knodia/common-models/ids";
import type { FastifyBaseLogger } from "fastify";

import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { createClient } from "redis";

import type { HTTPServiceName } from "../models/errors/services.ts";
import type { RateLimiterConfig } from "./config.ts";
import type { HashedRateLimitKey } from "./hashRateLimitKey.ts";

import { buildAwsIamCredentialsProvider } from "./awsIamAuthTokenProvider.ts";

export interface RateLimiter {
  consume(
    rateLimitKey: RateLimitKey,
    logger: FastifyBaseLogger,
  ): Promise<RateLimiterStatus>;
  disconnect(): Promise<void>;
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

export type RateLimitKey =
  | ExternalId<OrganizationId>
  | HashedRateLimitKey
  | OrganizationId;

interface InitRedisRateLimiterOptions {
  config: RateLimiterConfig;
  // Services not tied to a specific Knode (e.g. signup-manager) have no
  // knodeId; their key namespace omits that segment.
  knodeId?: KnodeId;
  logger: FastifyBaseLogger;
  serviceName: HTTPServiceName;
}

// Rate limiter for build paths that wire the app without serving traffic (today
// only OpenAPI generation). Opens no Redis connection, so the generator stays
// hermetic — no Redis needed in CI.
export const noopRateLimiter: RateLimiter = {
  consume: async () => ({
    degraded: true,
    limitReached: false,
    maxRequests: 0,
    remainingRequests: 0,
    resetMs: 0,
  }),
  disconnect: async () => undefined,
};

export function initRedisRateLimiter({
  config,
  knodeId,
  logger,
  serviceName,
}: InitRedisRateLimiterOptions): RateLimiter {
  // knodeId is absent for central services (e.g. signup-manager); lower-cased so
  // the same knode maps to one key namespace regardless of how it's cased in config.
  const knodeSegment = knodeId ? `:${knodeId.toLowerCase()}` : "";
  const keyPrefix = `knodia-rate-limit:${config.rateLimiterEnvironment}${knodeSegment}:${serviceName}`;
  const maxRequests = config.rateLimiterMaxRequests;
  const rateIntervalMs = config.rateLimiterTimeWindowSeconds * 1_000;
  const timeoutMs = config.rateLimiterTimeoutSeconds * 1_000;

  // node-redis's inner reconnect loop awaits a raw (non-unref'd) setTimeout we
  // can't cancel, so it can pin the event loop for the full strategy delay after
  // `disconnect()`. `allowReconnect` lets `disconnect()` short-circuit the next
  // strategy call, bounding the shutdown wait to the current pending timer.
  let allowReconnect = true;

  const iamAuth = config.rateLimiterAwsIamAuth;
  const client = createClient({
    disableOfflineQueue: true,
    // IAM-authenticated ElastiCache requires TLS; resolves a fresh SigV4 token
    // per (re)connect via node-redis's async credentials provider.
    ...(iamAuth && {
      credentialsProvider: buildAwsIamCredentialsProvider(
        iamAuth,
        defaultProvider(),
      ),
    }),
    socket: {
      connectTimeout: timeoutMs,
      host: config.rateLimiterRedisHost,
      port: config.rateLimiterRedisPort,
      // Min 1s (guards `retries===0 ⇒ 0`, which would tight-loop), capped at 5s
      // so the worst-case shutdown wait stays under K8s's default 30s grace.
      reconnectStrategy: (retries: number) =>
        allowReconnect ? Math.min(Math.max(retries, 1) * 1_000, 5_000) : false,
      ...(iamAuth && { tls: true }),
    },
  });

  client.on("error", (err: Error) => {
    logger.warn({ err }, "Redis rate-limiter error");
  });

  // Eager, non-blocking connect (mirrors PDND): don't await it, so startup never
  // blocks on Redis. If Redis is down the client retries in the background and
  // `disableOfflineQueue: true` makes `consume` reject immediately (→ fail-open)
  // until it recovers.
  void client.connect().catch(() => {
    // The `error` handler above already logged; swallow here so the unawaited
    // promise can't surface as an unhandled rejection.
  });

  const rateLimiter = new RateLimiterRedis({
    duration: config.rateLimiterTimeWindowSeconds,
    keyPrefix,
    points: maxRequests,
    storeClient: client,
    useRedisPackage: true,
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
      try {
        // Bound consume latency: node-redis has no per-command timeout, so a
        // stalled Redis would otherwise hang the request indefinitely. The race
        // timer is `.unref()`'d so it never keeps the process alive on its own.
        const res = await Promise.race([
          rateLimiter.consume(rateLimitKey, 1),
          new Promise<never>((_, reject) => {
            const timer = setTimeout(
              () =>
                reject(
                  new Error(`Redis consume() timed out after ${timeoutMs}ms`),
                ),
              timeoutMs,
            );
            timer.unref();
          }),
        ]);
        return {
          degraded: false,
          limitReached: false,
          maxRequests,
          remainingRequests: res.remainingPoints,
          resetMs: res.msBeforeNext,
        };
      } catch (err) {
        if (err instanceof RateLimiterRes) {
          return {
            degraded: false,
            limitReached: true,
            maxRequests,
            remainingRequests: 0,
            resetMs: err.msBeforeNext,
          };
        }

        const message = err instanceof Error ? err.message : String(err);
        logger.warn(
          `Rate limiter degraded, allowing request through for key=${rateLimitKey}: ${message}`,
        );
        return failOpenStatus;
      }
    },
    // Close gracefully if connected, else force-destroy. `allowReconnect = false`
    // stops the background reconnect loop from scheduling another wait (see the
    // `allowReconnect` note above), bounding the shutdown delay to ≤ 5s.
    disconnect: async () => {
      allowReconnect = false;
      if (client.isReady) {
        await client.close().catch(() => undefined);
      } else {
        // `destroy()` throws ClientClosedError when the socket isn't open
        // (still connecting / never connected / already destroyed) — all mean
        // it's already torn down, so swallow.
        try {
          client.destroy();
        } catch {
          // intentional
        }
      }
    },
  };
}
