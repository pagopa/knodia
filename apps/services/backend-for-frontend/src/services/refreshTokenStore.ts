import { createClient } from "redis";

export interface RefreshTokenStore {
  consume(jti: string, expireAtSec: number): Promise<boolean>;
  disconnect(): Promise<void>;
  revoke(jti: string, expireAtSec: number): Promise<void>;
}

export async function createRefreshTokenStore(
  redisUrl: string,
): Promise<RefreshTokenStore> {
  const client = createClient({ url: redisUrl });
  await client.connect();

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

    async disconnect(): Promise<void> {
      await client.disconnect();
    },

    async revoke(jti: string, expireAtSec: number): Promise<void> {
      const key = `refresh:${jti}`;
      // Mark the JTI as consumed so it cannot be used again.
      // Uses SET with EXAT so the entry auto-expires at the token's original expiry.
      await client.set(key, "1", { EXAT: expireAtSec });
    },
  };
}
