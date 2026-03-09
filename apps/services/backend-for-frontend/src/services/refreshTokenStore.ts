import { createClient } from "redis";

export interface RefreshTokenStore {
  consume(jti: string, expireAtSec: number): Promise<boolean>;
  disconnect(): Promise<void>;
  revoke(jti: string, expireAtSec: number): Promise<void>;
}

export function createRefreshTokenStore(redisUrl: string): RefreshTokenStore {
  const client = createClient({ url: redisUrl });
  let connectPromise: Promise<void> | undefined;

  function ensureConnected(): Promise<void> {
    if (!connectPromise) {
      connectPromise = client.connect().then(() => undefined);
    }
    return connectPromise;
  }

  return {
    async consume(jti: string, expireAtSec: number): Promise<boolean> {
      await ensureConnected();
      const key = `refresh:${jti}`;
      // SET NX returns null if the key already exists (token already consumed)
      const result = await client.set(key, "1", {
        EXAT: expireAtSec,
        NX: true,
      });
      // result is "OK" on success, null if key already existed
      return result === "OK";
    },

    async disconnect(): Promise<void> {
      if (connectPromise) {
        await client.disconnect();
      }
    },

    async revoke(jti: string, expireAtSec: number): Promise<void> {
      await ensureConnected();
      const key = `refresh:${jti}`;
      // Mark the JTI as consumed so it cannot be used again.
      // Uses SET with EXAT so the entry auto-expires at the token's original expiry.
      await client.set(key, "1", { EXAT: expireAtSec });
    },
  };
}
