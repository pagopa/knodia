/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { API_GetPurposeFormSchemaQueryParams } from "../../src/models/purpose/api.ts";

import { injectAppRequest } from "../utils.ts";

const getCurrentPurposeFormSchemasMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getCurrentPurposeFormSchemas: getCurrentPurposeFormSchemasMock,
    },
  };
});

const knodeId = "Lynx";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getCurrentPurposeFormSchemas = (
  query: API_GetPurposeFormSchemaQueryParams,
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/purposes/formSchemas/current`).query(query);

describe("GET /purposes/formSchemas/current (getCurrentPurposeFormSchemas)", () => {
  beforeEach(() => {
    getCurrentPurposeFormSchemasMock.mockReset();
  });

  it.each(allowedTestTokens)(
    "should return 200 with form schemas ($type, $roles)",
    async (token) => {
      const mockResponse = {
        schema: { properties: {}, type: "object" },
        texts: { en: {} },
        uiSchema: { elements: [], type: "VerticalLayout" },
        version: "1.0",
      };
      getCurrentPurposeFormSchemasMock.mockResolvedValue({
        data: mockResponse,
      });

      const response = await getCurrentPurposeFormSchemas({ knodeId }, token);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockResponse);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await getCurrentPurposeFormSchemas({ knodeId }, spec);
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([{ query: {} }, { query: { knodeId: "InvalidKnode" } }])(
    "should return 400 if parameters are formatted incorrectly (%o)",
    async ({ query }) => {
      const response = await getCurrentPurposeFormSchemas(
        query as API_GetPurposeFormSchemaQueryParams,
      );

      expect(response.statusCode).toBe(400);
    },
  );
});
