/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { generateId, type PurposeId } from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_Purpose } from "../src/models/api.ts";

import { injectAppRequest } from "./utils.ts";

const VALID_PURPOSE_ID = generateId<PurposeId>();

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const defaultToken = allowedTestTokens[0]!;

const getPurpose = (purposeId: string, token: TestToken = defaultToken) =>
  injectAppRequest(token).get(`/purposes/${purposeId}`);

describe("GET /purposes/:purposeId (getPurpose)", () => {
  it.each(allowedTestTokens)(
    "should return the purpose with correct shape ($type, $roles)",
    async (token) => {
      const response = await getPurpose(VALID_PURPOSE_ID, token);

      expect(response.statusCode).toBe(200);

      const body = response.json<API_Purpose>();
      expect(body).toMatchObject({
        id: VALID_PURPOSE_ID,
      });
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getPurpose(VALID_PURPOSE_ID, token);
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid purpose id format", async () => {
    const response = await getPurpose("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
