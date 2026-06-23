// Derives the Integrity REST 02 producer signing key from KMS and prints the two
// values seed.sh substitutes into mock-integrity-rest-02-producer-keychain.sql:
//   KID         — the kid the mock-eservice puts on the Knodia-JWT-Signature header
//   ENCODED_PEM — base64 of the public-key PEM, stored as the producer keychain key
//
// Derive at runtime (no committed material): the mock signs with the key behind
// INTEGRITY_PRODUCER_KEY_KMS_ALIAS, which differs per env and is regenerated on
// every local `down -v` — deriving here keeps the seeded kid matching the signer.
//
// Output is shell-sourceable (KID='…'\nENCODED_PEM='…') so seed.sh can either
// `eval` it for a manual run or read it from the env file the local KMS setup
// writes for the seed init container.

import { GetPublicKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { createHash, createPublicKey } from "node:crypto";

// Mirror of @knodia/crypto.calculateKid (inlined to keep this a standalone node
// script). Must stay byte-identical: SHA-256 over the JWK with all members
// sorted, base64url. The mock computes the JWT header kid the same way, so the
// seeded kid matches.
const calculateKid = (jwk: Record<string, unknown>): string => {
  const sorted = Object.keys(jwk)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => ({ ...acc, [k]: jwk[k] }), {});
  return createHash("sha256").update(JSON.stringify(sorted)).digest("base64url");
};

const env = (name: string, fallback?: string): string => {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var ${name}`);
  return v;
};

const alias = env("INTEGRITY_PRODUCER_KEY_KMS_ALIAS");

const kms = new KMSClient({
  endpoint: process.env.AWS_ENDPOINT_URL_KMS,
  region: env("AWS_REGION", "eu-south-1"),
});

const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: alias }));
if (!PublicKey) throw new Error(`No public key for KMS alias '${alias}'`);

const publicKey = createPublicKey({ key: Buffer.from(PublicKey), format: "der", type: "spki" });
const encodedPem = Buffer.from(
  publicKey.export({ format: "pem", type: "spki" }).toString(),
).toString("base64");
const kid = calculateKid(publicKey.export({ format: "jwk" }) as Record<string, unknown>);

process.stdout.write(`KID='${kid}'\nENCODED_PEM='${encodedPem}'\n`);
