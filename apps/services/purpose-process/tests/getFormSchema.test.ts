import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import {
  CURRENT_FORM_SCHEMA_VERSION,
  getFormSchema,
  getFormUiSchema,
} from "../src/models/formSchemas.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

describe("GET /purposes/formSchemas/current (getCurrentFormSchema)", () => {
  it.each(allowedTestTokens)(
    "should return the current form schema with version ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        "/purposes/formSchemas/current",
      );
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        schema: getFormSchema(CURRENT_FORM_SCHEMA_VERSION),
        version: CURRENT_FORM_SCHEMA_VERSION,
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

describe("GET /purposes/formSchemas/current/ui (getCurrentFormUiSchema)", () => {
  it.each(allowedTestTokens)(
    "should return the current form UI schema with version ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        "/purposes/formSchemas/current/ui",
      );
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        uiSchema: getFormUiSchema(CURRENT_FORM_SCHEMA_VERSION),
        version: CURRENT_FORM_SCHEMA_VERSION,
      });
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        "/purposes/formSchemas/current/ui",
      );
      expect(response.statusCode).toBe(403);
    },
  );
});
