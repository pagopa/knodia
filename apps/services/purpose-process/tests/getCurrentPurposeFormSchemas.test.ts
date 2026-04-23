import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import { formSchemaStore, TEST_FORM_VERSION } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

describe("GET /purposes/formSchemas/current (getCurrentFormSchemas)", () => {
  it.each(allowedTestTokens)(
    "should return both schemas with version ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        "/purposes/formSchemas/current",
      );
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        ...(await formSchemaStore.getFormSchemas(TEST_FORM_VERSION)),
        version: TEST_FORM_VERSION,
      });
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        "/purposes/formSchemas/current",
      );
      expect(response.statusCode).toBe(403);
    },
  );
});
