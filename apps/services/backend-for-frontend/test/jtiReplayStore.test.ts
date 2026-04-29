import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import "@knodia/test-commons/dynamodb";
import { describe, expect, it } from "vitest";

import {
  dynamoClient,
  refreshTokenStore as store,
  refreshTokenTableName as tableName,
} from "./setup.ts";

describe("jtiReplayStore", () => {
  async function getItem(jti: string) {
    const result = await dynamoClient.send(
      new GetItemCommand({
        Key: { jti: { S: jti } },
        TableName: tableName,
      }),
    );
    return result.Item;
  }

  function futureExpiry(): number {
    return Math.floor(Date.now() / 1000) + 60;
  }

  describe("consume", () => {
    it("marks the JTI as used in DynamoDB on first use", async () => {
      const jti = crypto.randomUUID();

      const firstUse = await store.consume(jti, futureExpiry());

      expect(firstUse).toBe(true);
      expect(await getItem(jti)).toBeDefined();
    });

    it("rejects a replayed JTI (already used)", async () => {
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.consume(jti, exp);
      const firstUse = await store.consume(jti, exp);

      expect(firstUse).toBe(false);
    });

    it("stores a TTL matching the token expiry for auto-cleanup", async () => {
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.consume(jti, exp);

      const item = await getItem(jti);
      const ttlValue = item?.["ttl"]?.N;
      expect(ttlValue).toBeDefined();
      expect(Number(ttlValue)).toBe(exp);
    });

    it("treats distinct JTIs independently", async () => {
      const exp = futureExpiry();

      const first = await store.consume(crypto.randomUUID(), exp);
      const second = await store.consume(crypto.randomUUID(), exp);

      expect(first).toBe(true);
      expect(second).toBe(true);
    });

    it("overwrites a stale expired record (DynamoDB TTL cleanup lag)", async () => {
      const jti = crypto.randomUUID();
      const pastExpiry = Math.floor(Date.now() / 1000) - 60;

      await store.consume(jti, pastExpiry);

      const reuse = await store.consume(jti, futureExpiry());

      expect(reuse).toBe(true);
    });
  });

  describe("revoke", () => {
    it("marks the JTI as used so future consume attempts fail", async () => {
      const jti = crypto.randomUUID();
      const exp = futureExpiry();

      await store.revoke(jti, exp);

      expect(await getItem(jti)).toBeDefined();
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
