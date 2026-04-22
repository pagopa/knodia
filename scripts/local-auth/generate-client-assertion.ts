// Signs an RS256 JWT client assertion for the local authorization-server
// and writes it to collections/.env as CLIENT_ASSERTION_JWT so the
// authorization-server/Create Token.bru call can pick it up.
//
// stdout: the signed JWT and nothing else (so it can be piped / captured).
// stderr: everything else (logs, usage).

import {
  createHash,
  createPublicKey,
  createSign,
  randomUUID,
} from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COLLECTIONS_ENV_PATH = resolve(__dirname, "../../collections/.env");

// aud must match CLIENT_ASSERTION_ACCEPTED_AUDIENCES in authorization-server/.env.
const AUD = "test.knodia.org";
// Must not exceed CLIENT_ASSERTION_MAX_TOKEN_AGE_SECONDS in authorization-server/.env,
// otherwise the server rejects the assertion before it expires.
const DURATION_SECONDS = 300;

const { values } = parseArgs({
  options: {
    key: { type: "string" },
    keychainId: { type: "string" },
    purposeId: { type: "string" },
  },
  strict: true,
});

if (!values.key || !values.keychainId || !values.purposeId) {
  console.error(`Usage: node scripts/local-auth/generate-client-assertion.ts \\
  --key <path-to-pem-private-key> \\
  --keychainId <uuid> \\
  --purposeId <uuid>

Use \`pnpm generate-keypair\` first if you don't have a keypair yet.`);
  process.exit(1);
}

const { key: keyPath, keychainId, purposeId } = values;

const b64url = (data: string | Buffer): string =>
  Buffer.from(data).toString("base64url");

// Same algorithm as keychain-process: sha256(JSON.stringify(sortedJWK)) in base64url
function calculateKid(publicKeyPem: string): string {
  const pubKey = createPublicKey(publicKeyPem);
  const jwk = pubKey.export({ format: "jwk" });
  const sorted = Object.keys(jwk)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = jwk[k as keyof typeof jwk];
      return acc;
    }, {});
  return createHash("sha256")
    .update(JSON.stringify(sorted))
    .digest("base64url");
}

const privatePem = readFileSync(keyPath, "utf-8");
const publicKeyPem = createPublicKey(privatePem).export({
  type: "spki",
  format: "pem",
}) as string;
const kid = calculateKid(publicKeyPem);

console.error(`Using private key from ${keyPath}`);
console.error(`kid: ${kid}`);

const now = Math.floor(Date.now() / 1000);
const header = b64url(JSON.stringify({ alg: "RS256", kid, typ: "JWT" }));
const payload = b64url(
  JSON.stringify({
    sub: keychainId,
    iss: keychainId,
    aud: AUD,
    purpose_id: purposeId,
    jti: randomUUID(),
    iat: now,
    exp: now + DURATION_SECONDS,
  }),
);
const signingInput = `${header}.${payload}`;
const signer = createSign("RSA-SHA256");
signer.update(signingInput);
const signature = signer.sign(privatePem, "base64url");
const clientAssertion = `${signingInput}.${signature}`;

let existing = "";
try { existing = readFileSync(COLLECTIONS_ENV_PATH, "utf-8"); } catch { /* new file */ }
const envLine = `CLIENT_ASSERTION_JWT=${clientAssertion}`;
const pattern = /^CLIENT_ASSERTION_JWT=.*$/m;
writeFileSync(
  COLLECTIONS_ENV_PATH,
  pattern.test(existing) ? existing.replace(pattern, envLine) : existing.trimEnd() + "\n" + envLine + "\n",
);
console.error(`Bruno env written to ${COLLECTIONS_ENV_PATH}`);

process.stdout.write(`${clientAssertion}\n`);
