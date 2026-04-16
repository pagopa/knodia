import { KMSClient, SignCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = resolve(__dirname, "../../docker/tokens");

// Hardcoded configuration for local development
const USER_ID = "00000000-0000-4000-8000-000000000001";
const ORG_ID = "00000000-0000-4000-8000-000000000002";
const ROLES = ["administrative", "technical"];
const INTERNAL_SUB = "local-internal-service";

// Placeholder IDs for external-ui-session tokens (replace with real values for testing)
const EXTERNAL_AGREEMENT_ID = "00000000-0000-4000-8000-000000000010";
const EXTERNAL_CONSUMER_ID = "00000000-0000-4000-8000-000000000011";
const EXTERNAL_CONSUMER_KNODE_ID = "Orion";
const EXTERNAL_ESERVICE_ID = "00000000-0000-4000-8000-000000000012";
const EXTERNAL_PRODUCER_ID = "00000000-0000-4000-8000-000000000013";
const EXTERNAL_ESERVICE_VERSION_ID = "00000000-0000-4000-8000-000000000014";

import { TOKEN_TYPES } from "./token-types.mjs";

const TARGET_ENVIRONMENTS = ["local", "dev-lynx", "dev-orion"];

const type = process.argv[2] ?? "ui-session";
const targetEnv = process.argv[3] ?? "local";

if (!TOKEN_TYPES.includes(type) || !TARGET_ENVIRONMENTS.includes(targetEnv)) {
  console.error(`Usage: node generate-token.mjs [${TOKEN_TYPES.join("|")}] [${TARGET_ENVIRONMENTS.join("|")}]`);
  process.exit(1);
}

function getClaims(targetEnv, type) {
  const aud = targetEnv === "local"
    ? `local.knodia.test/${type}`
    : `app.${targetEnv.replace("dev-", "")}.dev.knodia.com/${type}`;

  switch (type) {
    case "ui-session":
      return { sub: USER_ID, organizationId: ORG_ID, roles: ROLES, username: "jane.doe", type, aud };
    case "internal":
      return { sub: INTERNAL_SUB, type, aud };
    case "external-ui-session":
      return {
        sub: randomUUID(),
        type,
        aud,
        scope: "agreement-activation",
        agreementId: EXTERNAL_AGREEMENT_ID,
        consumerId: EXTERNAL_CONSUMER_ID,
        consumerKnodeId: EXTERNAL_CONSUMER_KNODE_ID,
        eserviceId: EXTERNAL_ESERVICE_ID,
        producerId: EXTERNAL_PRODUCER_ID,
        eserviceVersionId: EXTERNAL_ESERVICE_VERSION_ID,
      };
  }
}

function getEnvVarName(targetEnv, type) {
  const base = type === "ui-session" ? "UI_SESSION_JWT"
    : type === "internal" ? "INTERNAL_JWT"
    : "EXTERNAL_UI_SESSION_JWT";
  if (targetEnv === "local") return base;
  return `${targetEnv.toUpperCase().replaceAll("-", "_")}_${base}`;
}

async function resolveKeyId(kmsClient, targetEnv, type) {
  if (targetEnv === "local") {
    return "alias/local-knodia-key";
  }
  const keyName = type === "internal" ? "internal" : "bff-session";
  const alias = `alias/${targetEnv}/app/${keyName}-tokens`;
  const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: alias }));
  return KeyMetadata.KeyId;
}

const claims = getClaims(targetEnv, type);

const kmsClient = new KMSClient(targetEnv === "local"
  ? { endpoint: "http://localhost:4566", region: "eu-south-1", credentials: { accessKeyId: "testawskey", secretAccessKey: "testawssecret" } }
  : { region: "eu-south-1" }
);
const kid = await resolveKeyId(kmsClient, targetEnv, type);

const b64url = (data) => Buffer.from(data).toString("base64url");

const header = b64url(
  JSON.stringify({ alg: "RS256", typ: "JWT", kid })
);

const now = Math.floor(Date.now() / 1000);

const payload = b64url(
  JSON.stringify({
    ...claims,
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
    KeyId: kid,
    Message: digest,
    MessageType: "DIGEST",
    SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
  })
);

const signature = Buffer.from(Signature).toString("base64url");
const token = `${message}.${signature}`;

console.log(`Generated ${type} token (${targetEnv}):`);
console.log(token);

const envTokensDir = resolve(TOKENS_DIR, targetEnv);
mkdirSync(envTokensDir, { recursive: true });
const tokenPath = resolve(envTokensDir, `${type}.token`);
writeFileSync(tokenPath, token);
console.log(`\nToken written to ${tokenPath}`);

const COLLECTIONS_DIR = resolve(__dirname, "../../collections");
const envPath = resolve(COLLECTIONS_DIR, ".env");
const envVarName = getEnvVarName(targetEnv, type);
const envLine = `${envVarName}=${token}`;

let existing = "";
try { existing = readFileSync(envPath, "utf-8"); } catch { /* new file */ }

const escapedEnvVarName = envVarName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pattern = new RegExp(`^${escapedEnvVarName}=.*$`, "m");
const updated = pattern.test(existing)
  ? existing.replace(pattern, envLine)
  : existing.trimEnd() + "\n" + envLine + "\n";

writeFileSync(envPath, updated);
console.log(`Bruno env written to ${envPath}`);
