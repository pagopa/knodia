import { importPKCS8, SignJWT } from "jose";
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = resolve(__dirname, "../../docker/keys");

// Hardcoded user and organization IDs for local development
const USER_ID = "00000000-0000-0000-0000-000000000001";
const ORG_ID = "00000000-0000-0000-0000-000000000002";
const ROLE = "role:administrative";

const type = process.argv[2] ?? "cognito";

if (type !== "cognito" && type !== "session") {
  console.error("Usage: node generate-token.mjs [cognito|session]");
  process.exit(1);
}

const privateKeyPath = resolve(KEYS_DIR, type, "private.pem");

let privateKeyPem;
try {
  privateKeyPem = readFileSync(privateKeyPath, "utf-8");
} catch {
  console.error(
    `Private key not found at ${privateKeyPath}.\nRun 'pnpm infra:start' first to generate keys.`
  );
  process.exit(1);
}

const privateKey = await importPKCS8(privateKeyPem, "RS256");

const claims =
  type === "cognito"
    ? {
        sub: USER_ID,
        "cognito:groups": [ROLE, `org:${ORG_ID}`],
        token_use: "access",
      }
    : {
        sub: USER_ID,
        organizationId: ORG_ID,
        role: ROLE,
      };

const token = await new SignJWT(claims)
  .setProtectedHeader({ alg: "RS256", kid: `local-${type}-key` })
  .setIssuedAt()
  .setExpirationTime("1h")
  .setJti(randomUUID())
  .setIssuer(`local-${type}`)
  .sign(privateKey);

console.log(`Generated ${type} token:`);
console.log(token);

const tokenPath = resolve(KEYS_DIR, `${type}.token`);
writeFileSync(tokenPath, token);
console.log(`\nToken written to ${tokenPath}`);
