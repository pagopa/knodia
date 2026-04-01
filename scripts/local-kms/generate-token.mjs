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

import { TOKEN_TYPES } from "./token-types.mjs";

const TARGET_ENVIRONMENTS = ["local", "dev-lynx", "dev-orion"];

const type = process.argv[2] ?? "ui-session";
const targetEnv = process.argv[3] ?? "local";

if (!TOKEN_TYPES.includes(type) || !TARGET_ENVIRONMENTS.includes(targetEnv)) {
  console.error(`Usage: node generate-token.mjs [${TOKEN_TYPES.join("|")}] [${TARGET_ENVIRONMENTS.join("|")}]`);
  process.exit(1);
}

// Extract node name once — null for local, "lynx"/"orion" for dev environments
const node = targetEnv === "local" ? null : targetEnv.replace("dev-", "");

function getClaimsAndEnvVar(type) {
  switch (type) {
    case "ui-session":
      return {
        claims: { sub: USER_ID, organizationId: ORG_ID, roles: ROLES, username: "jane.doe", type },
        envVarName: "UI_SESSION_JWT",
      };
    case "internal":
      return {
        claims: { sub: INTERNAL_SUB, type },
        envVarName: "INTERNAL_JWT",
      };
  }
}

async function buildTokenParameters(kmsClient, node, type) {
  if (!node) {
    return { kid: "alias/local-knodia-key", aud: `local.knodia.test/${type}` };
  }
  const keyName = type === "internal" ? "internal" : "bff-session";
  const alias = `alias/dev-${node}/app/${keyName}-tokens`;
  const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: alias }));
  return { kid: KeyMetadata.KeyId, aud: `app.${node}.dev.knodia.com/${type}` };
}

const { claims, envVarName } = getClaimsAndEnvVar(type);

const kmsClient = new KMSClient(node
  ? { region: "eu-south-1" }
  : { endpoint: "http://localhost:4566", region: "eu-south-1", credentials: { accessKeyId: "testawskey", secretAccessKey: "testawssecret" } }
);
const { kid, aud } = await buildTokenParameters(kmsClient, node, type);

const b64url = (data) => Buffer.from(data).toString("base64url");

const header = b64url(
  JSON.stringify({ alg: "RS256", typ: "JWT", kid })
);

const now = Math.floor(Date.now() / 1000);

const payload = b64url(
  JSON.stringify({
    ...claims,
    aud,
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

mkdirSync(TOKENS_DIR, { recursive: true });
const tokenPath = resolve(TOKENS_DIR, `${type}.token`);
writeFileSync(tokenPath, token);
console.log(`\nToken written to ${tokenPath}`);

const COLLECTIONS_DIR = resolve(__dirname, "../../collections");
const envPath = resolve(COLLECTIONS_DIR, ".env");
const envLine = `${envVarName}=${token}`;

let existing = "";
try { existing = readFileSync(envPath, "utf-8"); } catch { /* new file */ }

const pattern = new RegExp(`^${envVarName}=.*$`, "m");
const updated = pattern.test(existing)
  ? existing.replace(pattern, envLine)
  : existing.trimEnd() + "\n" + envLine + "\n";

writeFileSync(envPath, updated);
console.log(`Bruno env written to ${envPath}`);
