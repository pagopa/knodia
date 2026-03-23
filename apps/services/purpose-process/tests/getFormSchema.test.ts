/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import {
  CURRENT_FORM_SCHEMA_VERSION,
  formSchemas,
  formUiSchemas,
} from "../src/models/formSchemas.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { type: "internal" },
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /purposes/form/schema/:version (getFormSchema)", () => {
  it.each(allowedTestTokens)(
    "should return the form schema for the current version ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        `/purposes/form/schema/${CURRENT_FORM_SCHEMA_VERSION}`,
      );
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(formSchemas[CURRENT_FORM_SCHEMA_VERSION]);
    },
  );

  it("should return 404 for a non-existent version", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).get(
      "/purposes/form/schema/99.99",
    );
    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        `/purposes/form/schema/${CURRENT_FORM_SCHEMA_VERSION}`,
      );
      expect(response.statusCode).toBe(403);
    },
  );
});

describe("GET /purposes/form/ui-schema/:version (getFormUiSchema)", () => {
  it.each(allowedTestTokens)(
    "should return the form UI schema for the current version ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        `/purposes/form/ui-schema/${CURRENT_FORM_SCHEMA_VERSION}`,
      );
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        formUiSchemas[CURRENT_FORM_SCHEMA_VERSION],
      );
    },
  );

  it("should return 404 for a non-existent version", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).get(
      "/purposes/form/ui-schema/99.99",
    );
    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        `/purposes/form/ui-schema/${CURRENT_FORM_SCHEMA_VERSION}`,
      );
      expect(response.statusCode).toBe(403);
    },
  );
});
