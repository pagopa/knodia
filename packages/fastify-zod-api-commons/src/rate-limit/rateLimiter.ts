import type { ExternalId } from "@knodia/common-models/externalResource";
import type { KnodeId, OrganizationId } from "@knodia/common-models/ids";
import type { FastifyBaseLogger } from "fastify";

import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { createClient } from "redis";

import type { HTTPServiceName } from "../models/errors/services.ts";
import type { RateLimiterConfig } from "./config.ts";

export interface RateLimiter {
  consume(
    rateLimitKey: ExternalId<OrganizationId> | OrganizationId,
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
  knodeId: KnodeId;
  logger: FastifyBaseLogger;
  serviceName: HTTPServiceName;
}

export function initRedisRateLimiter({
  config,
  knodeId,
  logger,
  serviceName,
}: InitRedisRateLimiterOptions): RateLimiter {
  const keyPrefix = `knodia-rate-limit:${knodeId}:${serviceName}`;
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

  const client = createClient({
    disableOfflineQueue: true,
    socket: {
      connectTimeout: timeoutMs,
      host: config.rateLimiterRedisHost,
      port: config.rateLimiterRedisPort,
      // Min 1s on the first retry (Math.max guards `retries===0 ⇒ 0`,
      // which would tight-loop). Capped at 5s so the worst-case
      // shutdown wait stays well under K8s's default 30s grace.
      reconnectStrategy: (retries: number) =>
        allowReconnect ? Math.min(Math.max(retries, 1) * 1_000, 5_000) : false,
    },
  });

  client.on("error", (err: Error) => {
    logger.warn({ err }, "Redis rate-limiter error");
  });

  // Lazy connect: connecting at init pins the event loop in any build path
  // that doesn't actually call `consume` (e.g. OpenAPI generation in CI
  // with no Redis), because the linear reconnect strategy keeps scheduling
  // setTimeouts we cannot cancel from outside the client.
  //
  // The first `consume()` kicks the connection off and waits up to
  // `timeoutMs` for it to complete via a single shared `initialWaiter`. If
  // Redis is up this resolves in ~ms and the first request gets real
  // headers; if Redis is down the timer wins and we fall back to fail-open.
  //
  // Subsequent calls reuse the SAME `initialWaiter` (already resolved after
  // the first wait): they don't re-arm the timer or re-attach `.finally` to
  // the still-pending `connectPromise`. That avoids two regressions caught
  // in review: a per-request `timeoutMs` latency under sustained outage,
  // and unbounded growth of promise reactions on the long-lived
  // `connectPromise`. The wait timer is `.unref()`'d so it never on its
  // own keeps the process alive — only the node-redis reconnect loop does,
  // and `disconnect()` handles that.
  let connectPromise: Promise<unknown> | undefined;
  let initialWaiter: Promise<void> | undefined;
  const ensureConnected = async (): Promise<void> => {
    const pending = (connectPromise ??= client
      .connect()
      .catch(() => undefined));
    if (client.isReady) return;
    initialWaiter ??= new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      timer.unref();
      void pending.finally(() => {
        clearTimeout(timer);
        resolve();
      });
    });
    await initialWaiter;
  };

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
      await ensureConnected();
      try {
        // Bound consume latency: node-redis v4 has no per-command timeout,
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
    // No-op when `connect()` was never triggered (e.g. OpenAPI generation
    // never calls `consume`): the client has no socket and no pending
    // reconnect timer. Otherwise QUIT if ready, DISCONNECT if mid-retry.
    // The `allowReconnect=false` flag makes the next `reconnectStrategy`
    // call return `false`, so when the currently-pending (uncancellable)
    // inner `setTimeout(retryIn)` fires, the loop exits instead of
    // scheduling another wait — bounding the shutdown delay to the
    // current `retryIn` (≤ 5s with the cap above).
    disconnect: async () => {
      allowReconnect = false;
      if (!connectPromise) return;
      if (client.isReady) {
        await client.quit().catch(() => undefined);
      } else {
        await client.disconnect().catch(() => undefined);
      }
    },
  };
}
