import crypto from "crypto";
import { describe, expect, it } from "vitest";

import {
  invalidKeyLength,
  invalidPublicKey,
  notAllowedMultipleKeys,
  notAllowedPrivateKey,
  notAnRSAKey,
} from "../src/models/errors.ts";
import { calculateKid, createJWK } from "../src/utils/crypto.ts";

const toBase64 = (value: string) =>
  Buffer.from(value, "utf-8").toString("base64");

const createRsaKeyPair = (modulusLength: number) =>
  crypto.generateKeyPairSync("rsa", {
    modulusLength,
    privateKeyEncoding: {
      format: "pem",
      type: "pkcs8",
    },
    publicKeyEncoding: {
      format: "pem",
      type: "spki",
    },
  });

const createEcKeyPair = () =>
  crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
    privateKeyEncoding: {
      format: "pem",
      type: "pkcs8",
    },
    publicKeyEncoding: {
      format: "pem",
      type: "spki",
    },
  });

const rsa2048KeyPair = createRsaKeyPair(2048);
const rsa1024KeyPair = createRsaKeyPair(1024);
const anotherRsa2048KeyPair = createRsaKeyPair(2048);
const ecKeyPair = createEcKeyPair();

describe("createJWK", () => {
  it("should create a JWK from a valid RSA public key PEM encoded in base64", () => {
    const jwk = createJWK({
      pemKeyBase64: toBase64(rsa2048KeyPair.publicKey),
    });

    expect(jwk).toMatchObject({
      e: expect.any(String),
      kty: "RSA",
      n: expect.any(String),
    });
  });

  it("should throw if the provided key is not a valid public key", () => {
    expect.hasAssertions();

    expect(() =>
      createJWK({ pemKeyBase64: toBase64("not a valid key") }),
    ).toThrow(invalidPublicKey());
  });

  it("should throw if the provided key is a private key", () => {
    expect.hasAssertions();

    expect(() =>
      createJWK({
        pemKeyBase64: toBase64(rsa2048KeyPair.privateKey),
      }),
    ).toThrow(notAllowedPrivateKey());
  });

  it("should throw if the provided payload contains multiple keys", () => {
    expect.hasAssertions();

    const multipleKeysPem = [
      rsa2048KeyPair.publicKey.trim(),
      anotherRsa2048KeyPair.publicKey.trim(),
    ].join("\n");

    expect(() =>
      createJWK({
        pemKeyBase64: toBase64(multipleKeysPem),
      }),
    ).toThrow(notAllowedMultipleKeys());
  });

  it("should throw if the provided key is not an RSA key", () => {
    expect.hasAssertions();

    expect(() =>
      createJWK({
        pemKeyBase64: toBase64(ecKeyPair.publicKey),
      }),
    ).toThrow(notAnRSAKey());
  });

  it("should throw if the provided RSA key is shorter than 2048 bits", () => {
    expect(() =>
      createJWK({
        pemKeyBase64: toBase64(rsa1024KeyPair.publicKey),
      }),
    ).toThrow(invalidKeyLength(1024));
  });
});

describe("calculateKid", () => {
  it("should calculate the kid", async () => {
    const expetedKid = "23j6WZbSbFiX_By98MBDgjnL3ZPkJJU83euQxrZxVsA";
    const kid = calculateKid(
      createJWK({
        pemKeyBase64: `LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJDZ0tDQVFFQTZzMTBhR0pNTE9QS0xqSkFsUm9seTRqY0J4NTJYMzByMTU2WlJ3dEc3bU5qU0lRTWNsTHkKQnJ4Y1ovT1hDa3dTbndiZ3AzSXE3aElMcHBnT0E5MVRJNTdHSHpCSlpnNEgvTGFhcTZJMCtjRTNSMXZQbU9wegovNVlzRFB0Q3hydk1zaGFFaU5hSlprL0JjdEpNdGxhck5NWlZTRVVuaS9yNUlyeU1WZG1nQ01pUGhmZkdWQnZwCkphVTVOTkFDZFV0N0tsdUdubWxqT2QxNWdMc1FibkhXWUVGVEx1UlU1VDJiQS9Hb0JLUkVpejhjc29kRno4TTQKRDU5dDB6TjlQZHk1aEF6eXRuUnNQcnBwcHZyUzFFck9QTGluTWFya0tTZGdtSldsdENxeVhWeCtiZ1FmbGN0cQpjS01NbU1vem9LMzJ1VHNjZDh5NGFETGlvdk9zaVlxM1l3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0=`,
      }),
    );
    expect(kid).toEqual(expetedKid);
  });

  it("should calculate a stable kid for the same JWK regardless of property order", () => {
    const jwk = createJWK({
      pemKeyBase64: toBase64(rsa2048KeyPair.publicKey),
    });

    const reorderedJwk: JsonWebKey = {
      alg: "RS256",
      e: jwk.e,
      kty: jwk.kty,
      n: jwk.n,
      use: "sig",
    };

    const originalOrderJwk: JsonWebKey = {
      alg: "RS256",
      e: jwk.e,
      kty: jwk.kty,
      n: jwk.n,
      use: "sig",
    };

    expect(calculateKid(reorderedJwk)).toBe(calculateKid(originalOrderJwk));
  });

  it("should return a non-empty base64url string", () => {
    const jwk = createJWK({
      pemKeyBase64: toBase64(rsa2048KeyPair.publicKey),
    });

    const kid = calculateKid(jwk);

    expect(kid).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(kid.length).toBeGreaterThan(0);
  });
});
