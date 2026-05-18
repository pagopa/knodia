import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type JSONWebKeySet,
  SignJWT,
} from "jose";
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

import { verifyAgainstJwksSets } from "../../src/auth/verifyAgainstJwksSets.ts";
import { ApiError } from "../../src/models/errors/apiError.ts";

const ISSUER = "https://issuer.example";
const AUDIENCE = "test.audience";

async function makeJwksAndSigner(kid: string) {
  const { privateKey, publicKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = kid;
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";
  const jwks: JSONWebKeySet = { keys: [publicJwk] };

  async function sign(
    overrides: { audience?: string; issuer?: string; typ?: string } = {},
  ) {
    return new SignJWT({})
      .setProtectedHeader({
        alg: "RS256",
        kid,
        typ: overrides.typ ?? "JWT",
      })
      .setSubject(randomUUID())
      .setIssuer(overrides.issuer ?? ISSUER)
      .setAudience(overrides.audience ?? AUDIENCE)
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
  }

  return { jwksSet: createLocalJWKSet(jwks), sign };
}

describe("verifyAgainstJwksSets", () => {
  let jwksSetA: ReturnType<typeof createLocalJWKSet>;
  let jwksSetB: ReturnType<typeof createLocalJWKSet>;
  let signA: (overrides?: {
    audience?: string;
    issuer?: string;
    typ?: string;
  }) => Promise<string>;
  let signB: (overrides?: {
    audience?: string;
    issuer?: string;
    typ?: string;
  }) => Promise<string>;

  beforeAll(async () => {
    const a = await makeJwksAndSigner("kid-a");
    const b = await makeJwksAndSigner("kid-b");
    jwksSetA = a.jwksSet;
    jwksSetB = b.jwksSet;
    signA = a.sign;
    signB = b.sign;
  });

  it("verifies against the first matching JWKS in the array", async () => {
    const token = await signA();
    const payload = (await verifyAgainstJwksSets({
      audience: AUDIENCE,
      issuer: ISSUER,
      jwksSets: [jwksSetA, jwksSetB],
      token,
    })) as { iss: string };
    expect(payload.iss).toBe(ISSUER);
  });

  it("verifies against the second JWKS when the first does not match", async () => {
    const token = await signB();
    const payload = (await verifyAgainstJwksSets({
      audience: AUDIENCE,
      issuer: ISSUER,
      jwksSets: [jwksSetA, jwksSetB],
      token,
    })) as { iss: string };
    expect(payload.iss).toBe(ISSUER);
  });

  it("accepts a token whose typ header matches the expected typ", async () => {
    const token = await signA({ typ: "at+jwt" });
    const payload = (await verifyAgainstJwksSets({
      audience: AUDIENCE,
      issuer: ISSUER,
      jwksSets: [jwksSetA],
      token,
      typ: "at+jwt",
    })) as { iss: string };
    expect(payload.iss).toBe(ISSUER);
  });

  it("rejects a token whose typ header does not match the expected typ", async () => {
    const token = await signA({ typ: "JWT" });
    await expect(
      verifyAgainstJwksSets({
        audience: AUDIENCE,
        issuer: ISSUER,
        jwksSets: [jwksSetA],
        token,
        typ: "at+jwt",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("throws a generic unauthorized error by default (no reasons propagated)", async () => {
    const token = await signA({ audience: "wrong.audience" });
    let caught: unknown;
    try {
      await verifyAgainstJwksSets({
        audience: AUDIENCE,
        errorMessage: "Token verification failed",
        issuer: ISSUER,
        jwksSets: [jwksSetA],
        token,
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError<string>).errors[0]?.detail).toBe(
      "Token verification failed",
    );
  });

  it("propagates underlying reasons when propagateReasons is true", async () => {
    const token = await signA({ audience: "wrong.audience" });
    let caught: unknown;
    try {
      await verifyAgainstJwksSets({
        audience: AUDIENCE,
        errorMessage: "Token verification failed",
        issuer: ISSUER,
        jwksSets: [jwksSetA],
        propagateReasons: true,
        token,
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    const detail = (caught as ApiError<string>).errors[0]?.detail ?? "";
    expect(detail).toMatch(/^Token verification failed: /);
    expect(detail.length).toBeGreaterThan("Token verification failed: ".length);
  });
});
