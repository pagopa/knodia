import { type FastifyBaseLogger } from "fastify";
import { createClient } from "redis";

export type RefreshTokenStore = ReturnType<typeof createRefreshTokenStore>;

export function createRefreshTokenStore(
  redisUrl: string,
  logger: FastifyBaseLogger,
) {
  const client = createClient({
    socket: {
      reconnectStrategy: (retries: number) => Math.min(retries * 1_000, 30_000),
    },
    url: redisUrl,
  }).on("error", (err: unknown) =>
    logger.warn(`Redis client error (${redisUrl}): ${String(err)}`),
  );

  void client
    .connect()
    .then(() => logger.info(`Redis client connected (${redisUrl})`));

  return {
    async consume(jti: string, expireAtSec: number): Promise<boolean> {
      const key = `refresh:${jti}`;
      // SET NX returns null if the key already exists (token already consumed)
      const result = await client.set(key, "1", {
        EXAT: expireAtSec,
        NX: true,
      });
      // result is "OK" on success, null if key already existed
      return result === "OK";
    },

    async revoke(jti: string, expireAtSec: number): Promise<void> {
      const key = `refresh:${jti}`;
      // Mark the JTI as consumed so it cannot be used again.
      // Uses SET with EXAT so the entry auto-expires at the token's original expiry.
      await client.set(key, "1", { EXAT: expireAtSec });
    },
  };
}
