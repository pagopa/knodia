/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type EserviceId, generateId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { toExpectAPI_Eservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Eservice } from "../src/models/api.ts";

import { mockEservices } from "./mockEservices.ts";
import { injectAppRequest, seedEservice } from "./utils.ts";

const eservice = mockEservices[0]!;
const VALID_ESERVICE_ID = eservice.id;
const NON_EXISTENT_ESERVICE_ID = generateId<EserviceId>();

const allowedTestTokens: TestToken[] = [
  { type: "internal" },
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getEservice = (
  eserviceId: string,
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/eservices/${eserviceId}`);

describe("GET /eservices/:eserviceId (getEservice)", () => {
  it.each(allowedTestTokens)(
    "should return the e-service with correct shape ($type, $roles)",
    async (token) => {
      await seedEservice(eservice);

      const response = await getEservice(VALID_ESERVICE_ID, token);

      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");
      expect(response.statusCode).toBe(200);

      const body = response.json<API_Eservice>();
      expect(body).toEqual(toExpectAPI_Eservice(eservice));
    },
  );

  it("should return the same e-service as the list endpoint", async () => {
    await Promise.all(mockEservices.map(seedEservice));

    const uiToken: TestToken = {
      roles: ["administrative"],
      type: "ui-session",
    };
    const listResponse = await injectAppRequest(uiToken)
      .get("/eservices")
      .query({ limit: "50", offset: "0" });
    const listBody = listResponse.json<{ items: API_Eservice[] }>();
    const expectedItem = listBody.items.find((i) => i.id === VALID_ESERVICE_ID);

    const response = await getEservice(VALID_ESERVICE_ID);
    const body = response.json<API_Eservice>();

    expect(body).toEqual(toExpectAPI_Eservice(expectedItem!));
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getEservice(VALID_ESERVICE_ID, token);
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent e-service id", async () => {
    const response = await getEservice(NON_EXISTENT_ESERVICE_ID);
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid e-service id format", async () => {
    const response = await getEservice("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
