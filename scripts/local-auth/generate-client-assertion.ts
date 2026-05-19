// Signs an RS256 JWT client assertion for the local authorization-server
// and writes it to collections/.env so the Bruno collections can pick it up.
//
// Pass --knodeId for a Knode API token assertion (writes
// KNODE_API_CLIENT_ASSERTION_JWT). Pass --purposeId for an e-service access
// token assertion (writes CLIENT_ASSERTION_JWT). One of the two is required.
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

// Defaults target the local authorization-server. Override with --aud / --duration
// for envs whose ESERVICE_CLIENT_ASSERTION_ACCEPTED_AUDIENCES /
// KNODE_API_CLIENT_ASSERTION_ACCEPTED_AUDIENCES /
// CLIENT_ASSERTION_MAX_TOKEN_AGE_SECONDS differ.
const DEFAULT_AUD = "test.knodia.org";
const DEFAULT_DURATION_SECONDS = 300;

const { values } = parseArgs({
  options: {
    aud: { type: "string" },
    duration: { type: "string" },
    key: { type: "string" },
    keychainId: { type: "string" },
    knodeId: { type: "string" },
    purposeId: { type: "string" },
  },
  strict: true,
});

const isKnodeApi = values.knodeId !== undefined;
if (
  !values.key ||
  !values.keychainId ||
  (isKnodeApi && values.purposeId) ||
  (!isKnodeApi && !values.purposeId)
) {
  console.error(`Usage:
  E-service access token assertion:
    pnpm generate-client-assertion \\
      --key <path-to-pem-private-key> \\
      --keychainId <consumer-keychain-uuid> \\
      --purposeId <uuid> \\
      [--aud <audience>] [--duration <seconds>]

  Knode API token assertion:
    pnpm generate-client-assertion \\
      --key <path-to-pem-private-key> \\
      --keychainId <knode-api-keychain-uuid> \\
      --knodeId <Orion|Lynx> \\
      [--aud <audience>] [--duration <seconds>]

--aud defaults to ${DEFAULT_AUD}.
--duration defaults to ${DEFAULT_DURATION_SECONDS}s; must not exceed the
  server's accepted max token age.

Use \`pnpm generate-keypair\` first if you don't have a keypair yet.`);
  process.exit(1);
}

const { key: keyPath, keychainId } = values;
const aud = values.aud ?? DEFAULT_AUD;
const durationSeconds = values.duration
  ? Number(values.duration)
  : DEFAULT_DURATION_SECONDS;

if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
  console.error(
    `--duration must be a positive integer (got: ${values.duration})`,
  );
  process.exit(1);
}

const b64url = (data: Buffer | string): string =>
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
  format: "pem",
  type: "spki",
}) as string;
const kid = calculateKid(publicKeyPem);

console.error(`Using private key from ${keyPath}`);
console.error(`kid: ${kid}`);

const now = Math.floor(Date.now() / 1000);
const header = b64url(JSON.stringify({ alg: "RS256", kid, typ: "JWT" }));
const payload = b64url(
  JSON.stringify({
    aud,
    exp: now + durationSeconds,
    iat: now,
    iss: keychainId,
    jti: randomUUID(),
    sub: keychainId,
    ...(isKnodeApi
      ? { knode_id: values.knodeId }
      : { purpose_id: values.purposeId }),
  }),
);
const signingInput = `${header}.${payload}`;
const signer = createSign("RSA-SHA256");
signer.update(signingInput);
const signature = signer.sign(privatePem, "base64url");
const clientAssertion = `${signingInput}.${signature}`;

const envVarName = isKnodeApi
  ? "KNODE_API_CLIENT_ASSERTION_JWT"
  : "CLIENT_ASSERTION_JWT";

let existing = "";
try {
  existing = readFileSync(COLLECTIONS_ENV_PATH, "utf-8");
} catch {
  /* new file */
}
const envLine = `${envVarName}=${clientAssertion}`;
const pattern = new RegExp(`^${envVarName}=.*$`, "m");
writeFileSync(
  COLLECTIONS_ENV_PATH,
  pattern.test(existing)
    ? existing.replace(pattern, envLine)
    : existing.trimEnd() + "\n" + envLine + "\n",
);
console.error(`Bruno env ${envVarName} written to ${COLLECTIONS_ENV_PATH}`);

process.stdout.write(`${clientAssertion}\n`);
