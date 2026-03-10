import "@knodia/test-commons/redis";
import Fastify from "fastify";
import { createClient } from "redis";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import {
  createRefreshTokenStore,
  type RefreshTokenStore,
} from "../src/services/refreshTokenStore.ts";

const logger = Fastify({ logger: false }).log;

describe("refreshTokenStore", () => {
  let store: RefreshTokenStore;
  let redisClient: ReturnType<typeof createClient>;

  beforeAll(async () => {
    const redisUrl = inject("REDIS_CONNECTION_STRING");
    store = createRefreshTokenStore(redisUrl, logger);

    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  function futureExpiry(): number {
    return Math.floor(Date.now() / 1000) + 60;
  }

  describe("consume", () => {
    it("marks the JTI as used in Redis on first use", async () => {
      const jti = crypto.randomUUID();

      const firstUse = await store.consume(jti, futureExpiry());

      expect(firstUse).toBe(true);
      expect(await redisClient.exists(`refresh:${jti}`)).toBe(1);
    });

    it("rejects a replayed JTI (already used)", async () => {
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.consume(jti, exp);
      const firstUse = await store.consume(jti, exp);

      expect(firstUse).toBe(false);
    });

    it("sets a TTL matching the token expiry so entries auto-cleanup", async () => {
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.consume(jti, exp);

      const ttl = await redisClient.ttl(`refresh:${jti}`);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it("treats distinct JTIs independently", async () => {
      const exp = futureExpiry();

      const first = await store.consume(crypto.randomUUID(), exp);
      const second = await store.consume(crypto.randomUUID(), exp);

      expect(first).toBe(true);
      expect(second).toBe(true);
    });
  });

  describe("revoke", () => {
    it("marks the JTI as used so future consume attempts fail", async () => {
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.revoke(jti, exp);

      expect(await redisClient.exists(`refresh:${jti}`)).toBe(1);
      expect(await store.consume(jti, exp)).toBe(false);
    });

    it("is idempotent — revoking the same JTI twice does not throw", async () => {
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.revoke(jti, exp);
      await expect(store.revoke(jti, exp)).resolves.toBeUndefined();
    });
  });
});
