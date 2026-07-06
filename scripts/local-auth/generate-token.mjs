import { KMSClient, SignCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = resolve(__dirname, "../../docker/tokens");

// Hardcoded configuration for local development
const USER_ID = "00000000-0000-4000-8000-000000000001";
const ORG_ID = "00000000-0000-4000-8000-000000000004";
const ROLES = ["administrative", "technical"];

// ui-session operator username shown in the UI; per POC org so `--org` logins
// display the right operator (matches scripts/local-auth/local-cognito.mjs).
const DEFAULT_USERNAME = "mario_rossi";
const ORG_USERNAMES = {
  "00000000-0000-4000-8000-000000000101": "business_booklet_lynx_admin",
  "00000000-0000-4000-8000-000000000102":
    "construction_companies_registry_orion_admin",
  "00000000-0000-4000-8000-000000000103": "student_registry_lynx_admin",
  "00000000-0000-4000-8000-000000000104": "academy_orion_admin",
  "00000000-0000-4000-8000-000000000105": "system_serc_lynx_admin",
  "00000000-0000-4000-8000-000000000106": "system_serc_orion_admin",
  "00000000-0000-4000-8000-000000000107": "supervisory_body_orion_admin",
};
const INTERNAL_SUB = "local-internal-service";
const MAINTENANCE_SUB = "maintenance-operator";

// Placeholder IDs for external-ui-session tokens (replace with real values for testing)
const EXTERNAL_AGREEMENT_ID = "00000000-0000-4000-8000-000000000010";
const EXTERNAL_AGREEMENT_KNODE_ID = "Orion";
const EXTERNAL_CONSUMER_ID = "00000000-0000-4000-8000-000000000011";
const EXTERNAL_CONSUMER_KNODE_ID = "Orion";
const EXTERNAL_ESERVICE_ID = "00000000-0000-4000-8000-000000000012";
const EXTERNAL_ESERVICE_KNODE_ID = "Orion";
const EXTERNAL_PRODUCER_ID = "00000000-0000-4000-8000-000000000013";
const EXTERNAL_PRODUCER_KNODE_ID = "Orion";
const EXTERNAL_ESERVICE_VERSION_ID = "00000000-0000-4000-8000-000000000014";

// Placeholder IDs for knode-api tokens (replace with real values for testing)
const KNODE_API_KEYCHAIN_ID = "00000000-0000-4000-8000-000000000020";
const KNODE_API_KEYCHAIN_KNODE_ID = "Orion";
const KNODE_API_ORG_KNODE_ID = "Orion";

// Placeholder values for signup-session tokens (replace with real values for testing).
// This is a SPID profile (spidCode); for CIE / eIDAS swap it for fiscalNumber /
// personIdentifier and set `sub` to the same value.
const SIGNUP_NAME = "Mario";
const SIGNUP_FAMILY_NAME = "Rossi";
const SIGNUP_DATE_OF_BIRTH = "1980-01-01";
const SIGNUP_SPID_CODE = "SPID-001";
const SIGNUP_ONE_ID_NONCE = "local-signup-nonce";

import { TOKEN_TYPES } from "./token-types.mjs";

const TARGET_ENVIRONMENTS = ["local", "dev-lynx", "dev-orion", "dev-signup"];

// Tokens for the signup domain, which sits outside the knodes: type -> KMS key name.
const SIGNUP_DOMAIN_KEY_NAMES = { maintenance: "maintenance", "ui-signup-session": "ui-session" };

const { values: args } = parseArgs({
  options: {
    type: { type: "string", default: "ui-session" },
    env: { type: "string", default: "local" },
    // Optional: mint a ui-session for a specific org (e.g. a POC org seeded in scripts/seed/sql).
    org: { type: "string" },
    // Optional: override the subject (operator user id) of the ui-session.
    user: { type: "string" },
  },
});

const type = args.type;
const targetEnv = args.env;
const orgId = args.org ?? ORG_ID;
// A dedicated org (e.g. a POC org) is seeded with an operator whose id equals the
// org id, so a ui-session for that org must carry that sub or keychain operations
// won't authorize the caller. Override explicitly with --user when needed.
const subjectId = args.user ?? (args.org !== undefined ? orgId : USER_ID);

if (!TOKEN_TYPES.includes(type) || !TARGET_ENVIRONMENTS.includes(targetEnv)) {
  console.error(
    `Usage: node generate-token.mjs [--type ${TOKEN_TYPES.join("|")}] [--env ${TARGET_ENVIRONMENTS.join("|")}] [--org <organizationId>] [--user <userId>]`,
  );
  process.exit(1);
}

// On dev, signup-domain tokens are knode-neutral (single shared key, signup
// host): they must target dev-signup, and knode-bound tokens must not.
const isSignupDomainType = type in SIGNUP_DOMAIN_KEY_NAMES;
if (targetEnv !== "local" && isSignupDomainType !== (targetEnv === "dev-signup")) {
  console.error(
    isSignupDomainType
      ? `--type ${type} is knode-neutral: use --env dev-signup`
      : `--type ${type} is knode-bound: use --env dev-lynx or dev-orion`,
  );
  process.exit(1);
}

function getAudience(targetEnv, type) {
  if (type === "knode-api") {
    return targetEnv === "local"
      ? ["signalhub.test.knodia.org", "k2o-gateway.test.knodia.org"]
      : [`signalhub.${targetEnv.replace("dev-", "")}.dev.knodia.com`, `k2o-gateway.${targetEnv.replace("dev-", "")}.dev.knodia.com`];
  }
  if (targetEnv === "local") return `local.knodia.test/${type}`;
  // Signup-domain tokens are accepted on the signup host, not the knode apps.
  return isSignupDomainType
    ? `signup.${baseEnv(targetEnv)}.knodia.com/${type}`
    : `app.${targetEnv.replace("dev-", "")}.dev.knodia.com/${type}`;
}

// Strips the knode suffix from a target env ("dev-lynx" -> "dev"), for tokens
// that aren't bound to a single knode.
function baseEnv(targetEnv) {
  return targetEnv.split("-")[0];
}

function getClaims(targetEnv, type, orgId, subjectId) {
  const aud = getAudience(targetEnv, type);

  switch (type) {
    case "ui-session":
      return {
        sub: subjectId,
        organizationId: orgId,
        roles: ROLES,
        username: ORG_USERNAMES[orgId] ?? DEFAULT_USERNAME,
        type,
        aud,
      };
    case "internal":
      return { sub: INTERNAL_SUB, type, aud };
    case "maintenance":
      return { sub: MAINTENANCE_SUB, type, aud };
    case "external-ui-session":
      return {
        sub: randomUUID(),
        type,
        aud,
        scope: "agreement-activation",
        agreement: {
          id: EXTERNAL_AGREEMENT_ID,
          knode_id: EXTERNAL_AGREEMENT_KNODE_ID,
        },
        consumer: {
          id: EXTERNAL_CONSUMER_ID,
          knode_id: EXTERNAL_CONSUMER_KNODE_ID,
        },
        eservice: {
          id: EXTERNAL_ESERVICE_ID,
          knode_id: EXTERNAL_ESERVICE_KNODE_ID,
          version: EXTERNAL_ESERVICE_VERSION_ID,
        },
        producer: {
          id: EXTERNAL_PRODUCER_ID,
          knode_id: EXTERNAL_PRODUCER_KNODE_ID,
        },
      };
    case "knode-api":
      return {
        sub: KNODE_API_KEYCHAIN_ID,
        type,
        aud,
        client_id: KNODE_API_KEYCHAIN_ID,
        keychain: {
          id: KNODE_API_KEYCHAIN_ID,
          knode_id: KNODE_API_KEYCHAIN_KNODE_ID,
        },
        organization: { id: orgId, knode_id: KNODE_API_ORG_KNODE_ID },
      };
    case "ui-signup-session":
      return {
        sub: SIGNUP_SPID_CODE,
        type,
        aud,
        name: SIGNUP_NAME,
        familyName: SIGNUP_FAMILY_NAME,
        dateOfBirth: SIGNUP_DATE_OF_BIRTH,
        spidCode: SIGNUP_SPID_CODE,
        oneIdNonce: SIGNUP_ONE_ID_NONCE,
      };
  }
}

function getEnvVarName(targetEnv, type) {
  const base = type === "ui-session" ? "UI_SESSION_JWT"
    : type === "internal" ? "INTERNAL_JWT"
    : type === "maintenance" ? "MAINTENANCE_JWT"
    : type === "knode-api" ? "KNODE_API_JWT"
    : type === "ui-signup-session" ? "UI_SIGNUP_SESSION_JWT"
    : "EXTERNAL_UI_SESSION_JWT";
  if (targetEnv === "local") return base;
  // Signup-domain tokens are knode-neutral, so their env var doesn't carry the knode.
  const envPrefix = isSignupDomainType ? baseEnv(targetEnv) : targetEnv;
  return `${envPrefix.toUpperCase().replaceAll("-", "_")}_${base}`;
}

async function resolveKeyId(kmsClient, targetEnv, type) {
  if (targetEnv === "local") {
    return type === "knode-api"
      ? "alias/local-knodia-auth-server-key"
      : type === "maintenance"
      ? "alias/local-knodia-maintenance-key"
      : "alias/local-knodia-key";
  }
  const keyName = type === "internal" ? "internal"
    : type === "knode-api" ? "auth-server"
    : "bff-session";
  // Signup-domain keys are shared across knodes, under alias/<env>/signup/.
  const alias = isSignupDomainType
    ? `alias/${baseEnv(targetEnv)}/signup/${SIGNUP_DOMAIN_KEY_NAMES[type]}-tokens`
    : `alias/${targetEnv}/app/${keyName}-tokens`;
  const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: alias }));
  return KeyMetadata.KeyId;
}

const claims = getClaims(targetEnv, type, orgId, subjectId);

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
    ...(type === "knode-api" ? { nbf: now } : {}),
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

// When minting a ui-session for a specific org, print how to log into the local
// dev UI as that org (the app reads the session token from localStorage on load).
if (type === "ui-session" && args.org !== undefined) {
  console.log(`\nLog in to the dev UI as org ${args.org}:`);
  console.log(`  1. Open the frontend login page:`);
  console.log(`       - single-knode infra: http://localhost:5175/ui/`);
  console.log(`       - multinode infra:    http://localhost:5001/ui/ (Orion) or http://localhost:5002/ui/ (Lynx)`);
  console.log(`  2. Open the browser devtools console`);
  console.log(`  3. Paste and run:`);
  console.log(`     localStorage.setItem("knodia_auth_token", "${token}")`);
  console.log(`  4. Refresh the page`);
}
