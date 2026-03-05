import type { TestToken } from "@knodia/test-commons/auth";

import { forbiddenTestTokens } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /consumerKeychains (getConsumerKeychains)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token)
        .get("/consumerKeychains")
        .query(defaultQuery);
      expect(response.statusCode).toBe(403);
    },
  );

  it.todo.each([
    { limit: "abc", offset: "0" },
    { limit: "0", offset: "0" },
    { limit: "51", offset: "0" },
    { limit: "10", offset: "-1" },
    { limit: new Date(), offset: NaN },
    { limit: 9999999, offset: 9999999 },
    {
      ...defaultQuery,
      invalidParam: "invalid",
    },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async () => {
      expect(true).toBe(true);
    },
  );
});
