import "@knodia/test-commons/redis";
import Fastify from "fastify";
import { beforeAll, describe, expect, inject, it } from "vitest";

import {
  createRefreshTokenStore,
  type RefreshTokenStore,
} from "../src/services/refreshTokenStore.ts";

const logger = Fastify({ logger: false }).log;

describe("refreshTokenStore", () => {
  let store: RefreshTokenStore;

  beforeAll(async () => {
    store = createRefreshTokenStore(inject("REDIS_CONNECTION_STRING"), logger);
  });

  function futureExpiry(): number {
    return Math.floor(Date.now() / 1000) + 60;
  }

  describe("consume", () => {
    it("returns true on first use of a JTI", async () => {
      const jti = crypto.randomUUID();

      const result = await store.consume(jti, futureExpiry());

      expect(result).toBe(true);
    });

    it("returns false when the same JTI is consumed twice", async () => {
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.consume(jti, exp);
      const result = await store.consume(jti, exp);

      expect(result).toBe(false);
    });

    it("allows different JTIs to be consumed independently", async () => {
      const exp = futureExpiry();

      const first = await store.consume(crypto.randomUUID(), exp);
      const second = await store.consume(crypto.randomUUID(), exp);

      expect(first).toBe(true);
      expect(second).toBe(true);
    });
  });

  describe("revoke", () => {
    it("prevents a JTI from being consumed after revocation", async () => {
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.revoke(jti, exp);
      const result = await store.consume(jti, exp);

      expect(result).toBe(false);
    });

    it("is idempotent — revoking the same JTI twice does not throw", async () => {
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.revoke(jti, exp);
      await expect(store.revoke(jti, exp)).resolves.toBeUndefined();
    });
  });
});
