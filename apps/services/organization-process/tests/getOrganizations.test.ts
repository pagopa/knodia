import type { TestToken } from "@knodia/test-commons/auth";

import { forbiddenTestTokens } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /organizations (getOrganizations)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token)
        .get("/organizations")
        .query(defaultQuery);
      expect(response.statusCode).toBe(403);
    },
  );
});
