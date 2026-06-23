// Derive at runtime (no committed material): the signing key differs per env and is
// regenerated on every local `down -v`, so deriving here keeps the seeded kid
// matching the mock's signer. Output is shell-sourceable so seed.sh can eval it
// (manual run) or read the file the local KMS setup writes (init container).

import { GetPublicKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { createHash, createPublicKey } from "node:crypto";

// Inlined mirror of @knodia/crypto.calculateKid to keep this script standalone;
// must stay byte-identical so the seeded kid matches the mock's JWT header kid.
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
