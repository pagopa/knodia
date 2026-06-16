import type { ExternalId } from "@knodia/common-models/externalResource";
import type { KnodeId, OrganizationId } from "@knodia/common-models/ids";
import type { FastifyBaseLogger } from "fastify";

import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { createClient } from "redis";

import type { HTTPServiceName } from "../models/errors/services.ts";
import type { RateLimiterConfig } from "./config.ts";

import { buildAwsIamCredentialsProvider } from "./awsIamAuthTokenProvider.ts";

export interface RateLimiter {
  consume(
    organizationId: ExternalId<OrganizationId> | OrganizationId,
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

interface InitRedisRateLimiterOptions {
  config: RateLimiterConfig;
  environment: string;
  knodeId: KnodeId;
  logger: FastifyBaseLogger;
  serviceName: HTTPServiceName;
}

// Rate limiter for build paths that wire the app without serving traffic —
// today only OpenAPI generation, which boots the app to read its schema and
// then closes it. It never opens a Redis connection, so the generator stays
// hermetic (no Redis needed in CI) and the process exits cleanly. Keeping
// this here lets the production `initRedisRateLimiter` stay simple instead of
// carrying generation-only startup machinery.
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
  environment,
  knodeId,
  logger,
  serviceName,
}: InitRedisRateLimiterOptions): RateLimiter {
  // Lowercase the knodeId so the key namespace is uniformly lower-case
  const keyPrefix = `knodia-rate-limit:${environment}:${knodeId.toLowerCase()}:${serviceName}`;
  const maxRequests = config.rateLimiterMaxRequests;
  const rateIntervalMs = config.rateLimiterTimeWindowSeconds * 1_000;
  const timeoutMs = config.rateLimiterTimeoutSeconds * 1_000;

  // `allowReconnect` lets `disconnect()` short-circuit the next strategy
  // call. node-redis's inner reconnect loop awaits a raw (non-unref'd)
  // `setTimeout(retryIn)` we cannot cancel from outside, so the loop can
  // pin the event loop for the full strategy delay after `disconnect()`.
  // Capping the delay AND returning `false` once disconnect has fired
  // bounds the shutdown wait to the current pending timer.
  let allowReconnect = true;

  const iamAuth = config.rateLimiterAwsIamAuth;
  const client = createClient({
    disableOfflineQueue: true,
    // IAM-authenticated ElastiCache requires TLS; resolves a fresh 15-min
    // SigV4 token per (re)connect via node-redis's async credentials provider.
    // `defaultProvider()` walks env → SSO → web-identity (IRSA on EKS) → IMDS.
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
      // Min 1s on the first retry (Math.max guards `retries===0 ⇒ 0`,
      // which would tight-loop). Capped at 5s so the worst-case
      // shutdown wait stays well under K8s's default 30s grace.
      reconnectStrategy: (retries: number) =>
        allowReconnect ? Math.min(Math.max(retries, 1) * 1_000, 5_000) : false,
      ...(iamAuth && { tls: true }),
    },
  });

  client.on("error", (err: Error) => {
    logger.warn({ err }, "Redis rate-limiter error");
  });

  // Eager, non-blocking connect (mirrors PDND): kick off the connection but
  // don't await it. If Redis is down the client retries in the background per
  // `reconnectStrategy`, and `disableOfflineQueue: true` makes `consume`
  // reject immediately (→ fail-open) until it recovers, so startup never
  // blocks on Redis. Build paths that wire the app without serving traffic
  // (OpenAPI generation) use `noopRateLimiter`, so this never runs there.
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
        // Bound consume latency: node-redis has no per-command timeout,
        // so a stalled Redis (failover, slow Lua, cluster slot moved while
        // TCP stays up) would otherwise hang the request indefinitely.
        // The race timer is `.unref()`'d so it never on its own keeps the
        // process alive.
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
    // CLOSE (graceful) if connected, DESTROY (forced, sync) if mid-retry.
    // Setting `allowReconnect` false makes the next `reconnectStrategy` call
    // return `false`, so when the currently-pending (uncancellable) inner
    // `setTimeout(retryIn)` fires, the background loop exits instead of
    // scheduling another wait — bounding the shutdown delay to the current
    // `retryIn` (≤ 5s).
    disconnect: async () => {
      allowReconnect = false;
      if (client.isReady) {
        await client.close().catch(() => undefined);
      } else {
        // `destroy()` throws ClientClosedError when the underlying socket
        // isn't open (eager connect still racing / never succeeded / already
        // destroyed). All three mean the client is already torn down, so
        // swallow.
        try {
          client.destroy();
        } catch {
          // intentional
        }
      }
    },
  };
}
