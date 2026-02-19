import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = resolve(__dirname, "../../docker/tokens");

const KMS_ENDPOINT = "http://localhost:4566";

// Hardcoded configuration for local development
const USER_ID = "00000000-0000-0000-0000-000000000001";
const ORG_ID = "00000000-0000-0000-0000-000000000002";
const ROLES = ["role:administrative", "role:technical"];
const AUDIENCE = "local.knodia.test";

const type = process.argv[2] ?? "session";

if (type !== "cognito" && type !== "session") {
  console.error("Usage: node generate-token.mjs [cognito|session]");
  process.exit(1);
}

const kmsClient = new KMSClient({
  endpoint: KMS_ENDPOINT,
  region: "eu-south-1",
  credentials: { accessKeyId: "testawskey", secretAccessKey: "testawssecret" },
});

// Base64url encode helper
const b64url = (data) => Buffer.from(data).toString("base64url");

// Build JWT header
const header = b64url(
  JSON.stringify({ alg: "RS256", typ: "JWT", kid: `local-${type}-key` })
);

// Build JWT payload
const now = Math.floor(Date.now() / 1000);
const claims =
  type === "cognito"
    ? {
        sub: USER_ID,
        "cognito:groups": [...ROLES, `org:${ORG_ID}`],
        token_use: "access",
      }
    : {
        sub: USER_ID,
        organizationId: ORG_ID,
        role: ROLES,
        tokenType: "session",
      };

const payload = b64url(
  JSON.stringify({
    ...claims,
    iat: now,
    exp: now + 3600,
    jti: randomUUID(),
    iss: `local-${type}`,
    aud: AUDIENCE,
  })
);

// Sign with KMS using the alias directly
const message = `${header}.${payload}`;
const digest = createHash("sha256").update(message).digest();

const { Signature } = await kmsClient.send(
  new SignCommand({
    KeyId: `alias/local-${type}-key`,
    Message: digest,
    MessageType: "DIGEST",
    SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
  })
);

const signature = Buffer.from(Signature).toString("base64url");
const token = `${message}.${signature}`;

console.log(`Generated ${type} token:`);
console.log(token);

mkdirSync(KEYS_DIR, { recursive: true });
const tokenPath = resolve(KEYS_DIR, `${type}.token`);
writeFileSync(tokenPath, token);
console.log(`\nToken written to ${tokenPath}`);
