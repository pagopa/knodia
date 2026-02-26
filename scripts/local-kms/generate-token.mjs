import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = resolve(__dirname, "../../docker/tokens");

const KMS_ENDPOINT = "http://localhost:4566";

// Hardcoded configuration for local development
const USER_ID = "00000000-0000-4000-8000-000000000001";
const ORG_ID = "00000000-0000-4000-8000-000000000002";
const ROLES = ["administrative", "technical"];
const INTERNAL_SUB = "local-internal-service";

// Token type: determines the audience, claims structure, and output filename.
// All knodia-issued tokens share the "knodia" key regardless of type.
// Cognito tokens are handled by the local-cognito OIDC provider instead.
const type = process.argv[2] ?? "ui-session";

if (type !== "ui-session" && type !== "internal") {
  console.error("Usage: node generate-token.mjs [ui-session|internal]");
  process.exit(1);
}

const KID = "alias/local-knodia-key";

const kmsClient = new KMSClient({
  endpoint: KMS_ENDPOINT,
  region: "eu-south-1",
  credentials: { accessKeyId: "testawskey", secretAccessKey: "testawssecret" },
});

const b64url = (data) => Buffer.from(data).toString("base64url");

const header = b64url(
  JSON.stringify({ alg: "RS256", typ: "JWT", kid: KID })
);

const now = Math.floor(Date.now() / 1000);

const claims =
  type === "ui-session"
    ? {
        sub: USER_ID,
        organizationId: ORG_ID,
        roles: ROLES,
        type,
      }
    : {
        sub: INTERNAL_SUB,
        type,
      };

const payload = b64url(
  JSON.stringify({
    ...claims,
    aud: `local.knodia.test/${type}`,
    exp: now + 3600,
    iat: now,
    iss: "local-knodia",
    jti: randomUUID(),
  })
);

const message = `${header}.${payload}`;
const digest = createHash("sha256").update(message).digest();

const { Signature } = await kmsClient.send(
  new SignCommand({
    KeyId: KID,
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
const envVarName = type === "ui-session" ? "UI_SESSION_JWT" : "INTERNAL_JWT";
const envLine = `${envVarName}=${token}`;

let existing = "";
try { existing = readFileSync(envPath, "utf-8"); } catch { /* new file */ }

const pattern = new RegExp(`^${envVarName}=.*$`, "m");
const updated = pattern.test(existing)
  ? existing.replace(pattern, envLine)
  : existing.trimEnd() + "\n" + envLine + "\n";

writeFileSync(envPath, updated);
console.log(`Bruno env written to ${envPath}`);
