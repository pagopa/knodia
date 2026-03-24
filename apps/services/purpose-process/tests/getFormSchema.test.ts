/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import { getFormSchema, getFormUiSchema } from "../src/models/formSchemas.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

describe("GET /purposes/formSchemas/:version (getFormSchema)", () => {
  it.each(allowedTestTokens)(
    "should return the form schema for the current version ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        `/purposes/formSchemas/${PurposeFormSchemaVersion.enum["1.0"]}`,
      );
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        getFormSchema(PurposeFormSchemaVersion.enum["1.0"]),
      );
    },
  );

  it("should return 404 for a non-existent version", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).get(
      "/purposes/formSchemas/99.99",
    );
    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        `/purposes/formSchemas/${PurposeFormSchemaVersion.enum["1.0"]}`,
      );
      expect(response.statusCode).toBe(403);
    },
  );
});

describe("GET /purposes/formSchemas/:version/ui (getFormUiSchema)", () => {
  it.each(allowedTestTokens)(
    "should return the form UI schema for the current version ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        `/purposes/formSchemas/${PurposeFormSchemaVersion.enum["1.0"]}/ui`,
      );
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        getFormUiSchema(PurposeFormSchemaVersion.enum["1.0"]),
      );
    },
  );

  it("should return 404 for a non-existent version", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).get(
      "/purposes/formSchemas/99.99/ui",
    );
    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        `/purposes/formSchemas/${PurposeFormSchemaVersion.enum["1.0"]}/ui`,
      );
      expect(response.statusCode).toBe(403);
    },
  );
});
