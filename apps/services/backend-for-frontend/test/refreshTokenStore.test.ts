import Fastify from "fastify";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createRefreshTokenStore } from "../src/services/refreshTokenStore.ts";

const REDIS_PORT = 6379;
const REDIS_IMAGE = "redis:7-alpine";

const logger = Fastify({ logger: false }).log;

describe("refreshTokenStore", () => {
  let container: StartedTestContainer;
  let redisUrl: string;

  beforeAll(async () => {
    container = await new GenericContainer(REDIS_IMAGE)
      .withExposedPorts(REDIS_PORT)
      .start();

    redisUrl = `redis://${container.getHost()}:${container.getMappedPort(REDIS_PORT)}`;
  }, 60_000);

  afterAll(async () => {
    await container.stop();
  });

  function futureExpiry(): number {
    return Math.floor(Date.now() / 1000) + 60;
  }

  describe("consume", () => {
    it("returns true on first use of a JTI", async () => {
      const store = createRefreshTokenStore(redisUrl, logger);
      const jti = crypto.randomUUID();

      const result = await store.consume(jti, futureExpiry());

      expect(result).toBe(true);
    });

    it("returns false when the same JTI is consumed twice", async () => {
      const store = createRefreshTokenStore(redisUrl, logger);
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.consume(jti, exp);
      const result = await store.consume(jti, exp);

      expect(result).toBe(false);
    });

    it("allows different JTIs to be consumed independently", async () => {
      const store = createRefreshTokenStore(redisUrl, logger);
      const exp = futureExpiry();

      const first = await store.consume(crypto.randomUUID(), exp);
      const second = await store.consume(crypto.randomUUID(), exp);

      expect(first).toBe(true);
      expect(second).toBe(true);
    });
  });

  describe("revoke", () => {
    it("prevents a JTI from being consumed after revocation", async () => {
      const store = createRefreshTokenStore(redisUrl, logger);
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.revoke(jti, exp);
      const result = await store.consume(jti, exp);

      expect(result).toBe(false);
    });

    it("is idempotent — revoking the same JTI twice does not throw", async () => {
      const store = createRefreshTokenStore(redisUrl, logger);
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.revoke(jti, exp);
      await expect(store.revoke(jti, exp)).resolves.toBeUndefined();
    });
  });
});
