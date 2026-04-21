import { createHash, createPublicKey, generateKeyPairSync } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = resolve(__dirname, "../../docker/keys");
const COLLECTIONS_ENV_PATH = resolve(__dirname, "../../collections/.env");

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

function upsertEnvVars(vars: Record<string, string>): void {
  let content = "";
  try {
    content = readFileSync(COLLECTIONS_ENV_PATH, "utf-8");
  } catch {
    /* new file */
  }
  for (const [name, value] of Object.entries(vars)) {
    const line = `${name}=${value}`;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^${escaped}=.*$`, "m");
    content = pattern.test(content)
      ? content.replace(pattern, line)
      : content.trimEnd() + "\n" + line + "\n";
  }
  writeFileSync(COLLECTIONS_ENV_PATH, content);
}

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
const kid = calculateKid(publicKey);

mkdirSync(KEYS_DIR, { recursive: true });
const pubKeyPath = resolve(KEYS_DIR, `${kid}.pub.pem`);
const privKeyPath = resolve(KEYS_DIR, `${kid}.priv.pem`);
writeFileSync(pubKeyPath, publicKey);
writeFileSync(privKeyPath, privateKey);

upsertEnvVars({
  KEYCHAIN_PRIVATE_KEY_PATH: privKeyPath,
  KEYCHAIN_PUBLIC_KEY_B64: Buffer.from(publicKey, "utf-8").toString("base64"),
});

console.log(`kid: ${kid}`);
console.log(`Public key  written to ${pubKeyPath}`);
console.log(`Private key written to ${privKeyPath}`);
console.log(`\nBruno env updated at ${COLLECTIONS_ENV_PATH}:`);
console.log("  - KEYCHAIN_PRIVATE_KEY_PATH  (referenced by Create Token help messages)");
console.log("  - KEYCHAIN_PUBLIC_KEY_B64    (consumed by Upload Keychain Key)");
