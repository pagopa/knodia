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
const providedKid = values.kid;
const purposeId = values.purposeId;
const keyPath = values.key;
const durationSeconds = Number(values.duration);
// Per RFC, the aud identifies the authorization server where the JWT is
// presented. Must match CLIENT_ASSERTION_ACCEPTED_AUDIENCES in the
// authorization-server .env.
const DEFAULT_AUD = "test.knodia.org";
const aud = values.aud ?? DEFAULT_AUD;

if (!keychainId || !purposeId || !keyPath) {
  console.error(`Usage: node scripts/local-auth/generate-client-assertion.ts \\
  --key <path-to-pem-private-key> \\
  --keychainId <uuid> \\
  --purposeId <uuid> \\
  [--aud <audience>] \\
  [--kid <key-id>] \\
  [--duration <seconds>]

--aud defaults to ${DEFAULT_AUD}.
--kid defaults to the key id derived from the public key JWK (same algorithm
   as keychain-process), so it matches whatever was uploaded.

Use \`pnpm generate-keypair\` first if you don't have a keypair yet.`);
  process.exit(1);
}

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

function upsertEnvVar(name: string, value: string): void {
  let content = "";
  try {
    content = readFileSync(COLLECTIONS_ENV_PATH, "utf-8");
  } catch {
    /* new file */
  }
  const line = `${name}=${value}`;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}=.*$`, "m");
  const updated = pattern.test(content)
    ? content.replace(pattern, line)
    : content.trimEnd() + "\n" + line + "\n";
  writeFileSync(COLLECTIONS_ENV_PATH, updated);
}

const privatePem = readFileSync(keyPath, "utf-8");
const publicKeyPem = createPublicKey(privatePem).export({
  type: "spki",
  format: "pem",
}) as string;
const kid = providedKid ?? calculateKid(publicKeyPem);

console.error(`Using private key from ${keyPath}`);
console.error(`kid: ${kid}`);

const header = b64url(
  JSON.stringify({ alg: "RS256", kid, typ: "JWT" }),
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
const signature = signer.sign(privatePem, "base64url");
const clientAssertion = `${signingInput}.${signature}`;

upsertEnvVar("CLIENT_ASSERTION_JWT", clientAssertion);
console.error(
  `\nCLIENT_ASSERTION_JWT written to ${COLLECTIONS_ENV_PATH} (used by authorization-server/Create Token.bru).`,
);

process.stdout.write(`${clientAssertion}\n`);
