/* eslint-disable max-lines-per-function */
import {
  type EserviceId,
  type EserviceVersionId,
  generateId,
  KnodeId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { getCtx, TEST_KNODE_ID } from "./setup.ts";
import { signEserviceAccessToken } from "./utils.ts";

// Same hardcoded identity as apps/services/mock-eservice/src/routers/mockBearerRouter.ts
const EXPECTED_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "e7f5837e-75f4-431d-9465-73366d27bef2",
);
const EXPECTED_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "29721f0d-e36e-4157-bcdc-9629ace0f85b",
);
const EXPECTED_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);

const ENDPOINT = "/natural-persons/RMNLNR03H12H501Z";
const OTHER_KNODE_ID = KnodeId.enum.Lynx;

async function signToken(
  overrides: {
    audience?: string | string[];
    expiresIn?: string;
    issuer?: string;
    payload?: Record<string, unknown>;
    typ?: string;
  } = {},
) {
  return signEserviceAccessToken({
    eserviceId: EXPECTED_ESERVICE_ID,
    eserviceVersionId: EXPECTED_ESERVICE_VERSION_ID,
    knodeId: TEST_KNODE_ID,
    producerId: EXPECTED_PRODUCER_ID,
    tokenPrivateKey: getCtx().tokenKeys.tokenPrivateKey,
    ...overrides,
  });
}

describe("mock-eservice Bearer access-token verification", () => {
  it("returns 200 with the personal information for a known notation", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ dateOfBirth: "2003-06-12" });
  });

  it("returns 404 when the notation is not in the dataset", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: "/natural-persons/AAAAAA00A00A000A",
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 when the notation does not match the codice fiscale regex", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: "/natural-persons/not-a-codice-fiscale",
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when the notation is lowercase (uppercase-only regex)", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: "/natural-persons/rmnlnr03h12h501z",
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const res = await getCtx().app.inject({
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when the Authorization header does not use Bearer", async () => {
    const res = await getCtx().app.inject({
      headers: {
        authorization: "Basic dGVzdDp0ZXN0",
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for a token with the wrong audience", async () => {
    const token = await signToken({ audience: "some.other.audience" });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for a token with the wrong issuer", async () => {
    const token = await signToken({ issuer: "https://attacker.example" });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for an expired token", async () => {
    const token = await signToken({ expiresIn: "-1s" });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for a token with a tampered signature", async () => {
    const token = await signToken();
    const tampered = token.slice(0, -4) + "AAAA";
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${tampered}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when claims do not match the expected schema", async () => {
    const token = await signToken({
      payload: { consumer: "not-an-object" },
    });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when the header typ is not at+jwt", async () => {
    const token = await signToken({ typ: "JWT" });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when eservice.id does not match this e-service", async () => {
    const token = await signToken({
      payload: {
        eservice: {
          id: generateId(),
          knode_id: "Orion",
          version: EXPECTED_ESERVICE_VERSION_ID,
        },
      },
    });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when eservice.version does not match this e-service", async () => {
    const token = await signToken({
      payload: {
        eservice: {
          id: EXPECTED_ESERVICE_ID,
          knode_id: "Orion",
          version: generateId(),
        },
      },
    });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when producer.id does not match this e-service", async () => {
    const token = await signToken({
      payload: {
        producer: { id: generateId(), knode_id: TEST_KNODE_ID },
      },
    });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when eservice.knode_id does not match this knode", async () => {
    const token = await signToken({
      payload: {
        eservice: {
          id: EXPECTED_ESERVICE_ID,
          knode_id: OTHER_KNODE_ID,
          version: EXPECTED_ESERVICE_VERSION_ID,
        },
      },
    });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when producer.knode_id does not match this knode", async () => {
    const token = await signToken({
      payload: {
        producer: { id: EXPECTED_PRODUCER_ID, knode_id: OTHER_KNODE_ID },
      },
    });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when purpose.knode_id does not match this knode", async () => {
    const token = await signToken({
      payload: {
        purpose: { id: generateId(), knode_id: OTHER_KNODE_ID },
      },
    });
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(401);
  });
});
