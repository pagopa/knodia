import { createHash, createPublicKey, createSign, generateKeyPairSync, randomUUID } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = resolve(__dirname, "../../docker/keys");

const { values } = parseArgs({
  options: {
    keychainId: { type: "string" },
    kid: { type: "string" },
    purposeId: { type: "string" },
    aud: { type: "string" },
    key: { type: "string" },
    duration: { type: "string", default: "600" },
  },
  strict: true,
});

const keychainId = values.keychainId;
const kid = values.kid;
const purposeId = values.purposeId;
const aud = values.aud;
const keyPath = values.key;
const durationSeconds = Number(values.duration);

if (!keychainId || !purposeId || !aud) {
  console.error(`Usage: node scripts/local-kms/generate-client-assertion.ts \\
  --keychainId <uuid> \\
  --purposeId <uuid> \\
  --aud <audience> \\
  [--kid <key-id>] \\
  [--key <path-to-pem-private-key>] \\
  [--duration <seconds>]

If --key is omitted, a fresh RSA-2048 keypair is generated and
the public key is written to docker/keys/ for use in local testing.

If --kid is omitted, it is derived from the public key JWK (same
algorithm as keychain-process), so it will match after key upload.`);
  process.exit(1);
}

const b64url = (data: string | Buffer): string =>
  Buffer.from(data).toString("base64url");

// Derives the kid the same way keychain-process does: sha256(JSON.stringify(sortedJWK)) in base64url.
// This ensures the kid in the client assertion matches the one stored after key upload.
function calculateKid(publicKeyPem: string): string {
  const pubKey = createPublicKey(publicKeyPem);
  const jwk = pubKey.export({ format: "jwk" });
  const sorted = Object.keys(jwk)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => { acc[k] = jwk[k as keyof typeof jwk]; return acc; }, {});
  return createHash("sha256").update(JSON.stringify(sorted)).digest("base64url");
}

let privateKeyPem: string;
let resolvedKid: string;

if (keyPath) {
  privateKeyPem = readFileSync(keyPath, "utf-8");
  // Derive kid from the corresponding public key if not explicitly provided
  if (kid) {
    resolvedKid = kid;
  } else {
    const pubKey = createPublicKey(privateKeyPem);
    resolvedKid = calculateKid(pubKey.export({ type: "spki", format: "pem" }) as string);
  }
  console.log(`Using private key from ${keyPath}`);
  console.log(`kid: ${resolvedKid}`);
} else {
  console.log("No --key provided, generating a fresh RSA-2048 keypair...");
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  privateKeyPem = privateKey;
  resolvedKid = kid ?? calculateKid(publicKey);

  mkdirSync(KEYS_DIR, { recursive: true });
  const pubKeyPath = resolve(KEYS_DIR, `client-assertion-${resolvedKid}.pub.pem`);
  writeFileSync(pubKeyPath, publicKey);
  console.log(`Public key written to ${pubKeyPath}`);
  console.log(`kid: ${resolvedKid}`);
  console.log(
    "Associate this public key with the keychain in the Consumer Knode to complete the setup.\n",
  );
}

// Build JWT header — kid is already base64url (matches KeyId schema: z.base64url())
const header = b64url(
  JSON.stringify({
    alg: "RS256",
    kid: resolvedKid,
    typ: "JWT",
  }),
);

const now = Math.floor(Date.now() / 1000);

const payload = b64url(
  JSON.stringify({
    sub: keychainId,
    iss: keychainId,
    aud,
    purpose_id: purposeId,
    jti: randomUUID(),
    iat: now,
    exp: now + durationSeconds,
  }),
);

const signingInput = `${header}.${payload}`;
const signer = createSign("RSA-SHA256");
signer.update(signingInput);
const signature = signer.sign(privateKeyPem, "base64url");

const clientAssertion = `${signingInput}.${signature}`;

console.log("\n--- Client Assertion JWT ---\n");
console.log(clientAssertion);

console.log("\n--- Sample curl command ---\n");
console.log(`curl -X POST http://localhost:3200/token \\
  -H 'Content-Type: application/json' \\
  -d '{
    "client_assertion": "${clientAssertion}",
    "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    "consumer_keychain_id": "${keychainId}",
    "grant_type": "client_credentials"
  }'`);
