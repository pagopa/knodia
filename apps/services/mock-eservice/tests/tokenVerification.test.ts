import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  ACCEPTED_AUDIENCE,
  EXPECTED_ISSUER,
  getCtx,
  TEST_KID,
} from "./setup.ts";

const ENDPOINT = "/test";

async function signToken(
  overrides: {
    audience?: string | string[];
    expiresIn?: string;
    issuer?: string;
    payload?: Record<string, unknown>;
  } = {},
) {
  const { privateKey } = getCtx();
  const { audience, expiresIn = "5m", issuer, payload } = overrides;

  const now = Math.floor(Date.now() / 1000);
  const defaultPayload: Record<string, unknown> = {
    client_id: randomUUID(),
    consumer: { id: randomUUID(), knode_id: "Lynx" },
    eservice: { id: randomUUID(), knode_id: "Orion", version: randomUUID() },
    nbf: now,
    producer: { id: randomUUID(), knode_id: "Orion" },
    purpose: { id: randomUUID(), knode_id: "Lynx" },
  };

  const jwt = new SignJWT({ ...defaultPayload, ...payload })
    .setProtectedHeader({ alg: "RS256", kid: TEST_KID, typ: "JWT" })
    .setSubject(randomUUID())
    .setIssuer(issuer ?? EXPECTED_ISSUER)
    .setAudience(audience ?? ACCEPTED_AUDIENCE)
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
});
