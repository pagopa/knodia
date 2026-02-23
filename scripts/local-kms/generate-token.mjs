import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = resolve(__dirname, "../../docker/tokens");

const KMS_ENDPOINT = "http://localhost:4566";

// Hardcoded configuration for local development
const USER_ID = "00000000-0000-4000-8000-000000000001";
const ORG_ID = "00000000-0000-4000-8000-000000000002";
const ROLES = ["administrative", "technical"];

// Token type: determines the audience, claims structure, and output filename.
// - "cognito"    → simulates a Cognito user pool access token (signed with the cognito key)
// - "ui-session" → our UI session token (signed with the knodia key)
// New token types (e.g. "internal") should use the knodia key as well.
const type = process.argv[2] ?? "ui-session";

if (type !== "cognito" && type !== "ui-session") {
  console.error("Usage: node generate-token.mjs [cognito|ui-session]");
  process.exit(1);
}

// KMS key alias: "cognito" tokens use the cognito key; all knodia-issued tokens
// share the "knodia" key regardless of their type (ui-session, internal, etc.).
const keyAlias = type === "cognito" ? "cognito" : "knodia";

const kmsClient = new KMSClient({
  endpoint: KMS_ENDPOINT,
  region: "eu-south-1",
  credentials: { accessKeyId: "testawskey", secretAccessKey: "testawssecret" },
});

const b64url = (data) => Buffer.from(data).toString("base64url");

const header = b64url(
  JSON.stringify({ alg: "RS256", typ: "JWT", kid: `local-${keyAlias}-key` })
);

const now = Math.floor(Date.now() / 1000);
const claims =
  type === "cognito"
    ? {
        sub: USER_ID,
        "cognito:groups": [...ROLES.map((role) => `role:${role}`), `org:${ORG_ID}`],
        token_use: "access",
      }
    : {
        sub: USER_ID,
        organizationId: ORG_ID,
        roles: ROLES,
        type,
      };

const payload = b64url(
  JSON.stringify({
    ...claims,
    aud: `local.knodia.test/${type}`,
    exp: now + 3600,
    iat: now,
    iss: `local-${keyAlias}`,
    jti: randomUUID(),
  })
);

const message = `${header}.${payload}`;
const digest = createHash("sha256").update(message).digest();

const { Signature } = await kmsClient.send(
  new SignCommand({
    KeyId: `alias/local-${keyAlias}-key`,
    Message: digest,
    MessageType: "DIGEST",
    SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
  })
);

const signature = Buffer.from(Signature).toString("base64url");
const token = `${message}.${signature}`;

console.log(`Generated ${type} token:`);
console.log(token);

mkdirSync(TOKENS_DIR, { recursive: true });
const tokenPath = resolve(TOKENS_DIR, `${type}.token`);
writeFileSync(tokenPath, token);
console.log(`\nToken written to ${tokenPath}`);

const COLLECTIONS_DIR = resolve(__dirname, "../../collections");
const envPath = resolve(COLLECTIONS_DIR, ".env");
const brunoEnvKey = type === "ui-session" ? "UI_SESSION_JWT" : null;
if (brunoEnvKey) {
  writeFileSync(envPath, `${brunoEnvKey}=${token}\n`);
  console.log(`Bruno env written to ${envPath}`);
}

if (type === "ui-session") {
  const frontendEnvLocal = resolve(__dirname, "../../apps/web/node1-frontend/.env.local");
  writeFileSync(frontendEnvLocal, `VITE_DEV_SESSION_TOKEN=${token}\n`);
  console.log(`Frontend .env.local written to ${frontendEnvLocal}`);
}
