import { type EserviceAccessTokenClaims } from "@knodia/common-models/auth";
import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  type ConsumerKeychainId,
  type EserviceId,
  type EserviceVersionId,
  generateId,
  KnodeId,
  type OrganizationId,
  type PurposeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  ACCEPTED_AUDIENCES,
  EXPECTED_ISSUER,
  getCtx,
  TEST_KID,
  TEST_KNODE_ID,
} from "./setup.ts";

// Same hardcoded identity as apps/services/mock-eservice/src/routers/mockRouter.ts
// (kept in sync with docker/readmodel-seed/mock-eservice.sql).
const EXPECTED_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "10000000-0000-4000-8000-000000000001",
);
const EXPECTED_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "10000000-0000-4000-8000-000000000002",
);
const EXPECTED_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);

const ENDPOINT = "/test";
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
  const { privateKey } = getCtx();
  const {
    audience,
    expiresIn = "5m",
    issuer,
    payload,
    typ = "at+jwt",
  } = overrides;

  const now = Math.floor(Date.now() / 1000);
  const defaultPayload: Partial<EserviceAccessTokenClaims> = {
    client_id: generateId<ConsumerKeychainId>(),
    consumer: {
      id: generateExternalId<OrganizationId>(),
      knode_id: OTHER_KNODE_ID,
    },
    eservice: {
      id: EXPECTED_ESERVICE_ID,
      knode_id: TEST_KNODE_ID,
      version: EXPECTED_ESERVICE_VERSION_ID,
    },
    nbf: now,
    producer: { id: EXPECTED_PRODUCER_ID, knode_id: TEST_KNODE_ID },
    purpose: { id: generateId<PurposeId>(), knode_id: OTHER_KNODE_ID },
  };

  const jwt = new SignJWT({ ...defaultPayload, ...payload })
    .setProtectedHeader({ alg: "RS256", kid: TEST_KID, typ })
    .setSubject(randomUUID())
    .setIssuer(issuer ?? EXPECTED_ISSUER)
    .setAudience(audience ?? ACCEPTED_AUDIENCES)
    .setJti(randomUUID())
    .setIssuedAt(now)
    .setExpirationTime(expiresIn);

  return jwt.sign(privateKey);
}

describe("mock-eservice access-token verification", () => {
  it("returns 200 for a valid access token", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: ENDPOINT,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
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
});
