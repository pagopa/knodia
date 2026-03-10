import { type FastifyBaseLogger } from "fastify";
import { createClient } from "redis";

export type RefreshTokenStore = ReturnType<typeof createRefreshTokenStore>;

/**
 * Uses Redis as a set of "seen" JTIs to prevent refresh token replay.
 *
 * Each JTI is stored as a key with an expiry matching the token's `exp` claim,
 * so entries auto-cleanup after the token would have expired anyway.
 */
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

  const USED = "1"; // arbitrary value — only the key's existence matters

  function keyFor(jti: string): string {
    return `refresh:${jti}`;
  }

  return {
    /**
     * Marks a JTI as used. Returns `true` if this is the first use,
     * `false` if the JTI was already seen (replay attempt).
     *
     * Uses SET NX (set-if-not-exists) for atomicity.
     */
    async consume(jti: string, expireAtSec: number): Promise<boolean> {
      const result = await client.set(keyFor(jti), USED, {
        EXAT: expireAtSec,
        NX: true, // SET NX returns null if key already exists
      });
      const alreadyUsed = result === null;
      return !alreadyUsed;
    },

    /**
     * Unconditionally marks a JTI as used (e.g. on logout),
     * so any future consume attempt will fail.
     */
    async revoke(jti: string, expireAtSec: number): Promise<void> {
      await client.set(keyFor(jti), USED, { EXAT: expireAtSec });
    },
  };
}
