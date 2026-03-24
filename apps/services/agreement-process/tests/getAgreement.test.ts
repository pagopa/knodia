/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { type AgreementId, generateId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_Agreement } from "../src/models/api.ts";

import { mockAgreements } from "./mockAgreements.ts";
import {
  injectAppRequest,
  seedAgreement,
  toExpectAPI_Agreement,
} from "./utils.ts";

const agreement = mockAgreements[0]!;
const VALID_AGREEMENT_ID = agreement.id;
const NON_EXISTENT_AGREEMENT_ID = generateId<AgreementId>();

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
  { type: "internal" },
];

const getAgreement = (
  agreementId: string,
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/agreements/${agreementId}`);

describe("GET /agreements/:agreementId (getAgreement)", () => {
  it.each(allowedTestTokens)(
    "should return the agreement with correct shape ($type, $roles)",
    async (token) => {
      await seedAgreement(agreement);
      const response = await getAgreement(VALID_AGREEMENT_ID, token);

      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");
      expect(response.statusCode).toBe(200);

      const body = response.json<API_Agreement>();
      expect(body).toEqual(toExpectAPI_Agreement(agreement));
    },
  );

  it("should return the same agreement as the list endpoint", async () => {
    await seedAgreement(agreement);

    const listResponse = await injectAppRequest(allowedTestTokens[0]!)
      .get("/agreements")
      .query({ limit: "50", offset: "0" });

    const listBody = listResponse.json<{ items: API_Agreement[] }>();
    const expectedItem = listBody.items.find(
      (i) => i.id === VALID_AGREEMENT_ID,
    );

    const response = await getAgreement(VALID_AGREEMENT_ID);
    const body = response.json<API_Agreement>();

    expect(body).toEqual(toExpectAPI_Agreement(expectedItem!));
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getAgreement(VALID_AGREEMENT_ID, token);
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent agreement id", async () => {
    const response = await getAgreement(NON_EXISTENT_AGREEMENT_ID);
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid agreement id format", async () => {
    const response = await getAgreement("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
