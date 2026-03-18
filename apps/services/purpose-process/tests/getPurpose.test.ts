/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { generateId, type PurposeId } from "@knodia/common-models/ids";
import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import { toPurposeSQL } from "@knodia/db-readmodel-purpose/converters";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it } from "vitest";

import type { API_Purpose } from "../src/models/api.ts";

import { mockPurposes } from "./mockPurposes.ts";
import { readmodelDb } from "./setup.ts";
import { injectAppRequest, toExpectAPI_Purpose } from "./utils.ts";

const purpose = mockPurposes[0]!;
const VALID_PURPOSE_ID = purpose.id;
const NON_EXISTENT_PURPOSE_ID = generateId<PurposeId>();

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const defaultToken = allowedTestTokens[0]!;

const getPurpose = (purposeId: string, token: TestToken = defaultToken) =>
  injectAppRequest(token).get(`/purposes/${purposeId}`);

describe("GET /purposes/:purposeId (getPurpose)", () => {
  beforeEach(async () => {
    await Promise.all(
      mockPurposes.map((p) =>
        readmodelDb.insert(readmodelPurpose).values(toPurposeSQL(p, 0)),
      ),
    );
  });

  it.each(allowedTestTokens)(
    "should return the purpose with correct shape ($type, $roles)",
    async (token) => {
      const response = await getPurpose(VALID_PURPOSE_ID, token);

      expect(response.statusCode).toBe(200);

      const body = response.json<API_Purpose>();
      expect(body).toEqual(toExpectAPI_Purpose(purpose));
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getPurpose(VALID_PURPOSE_ID, token);
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent purpose id", async () => {
    const response = await getPurpose(NON_EXISTENT_PURPOSE_ID);
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid purpose id format", async () => {
    const response = await getPurpose("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
