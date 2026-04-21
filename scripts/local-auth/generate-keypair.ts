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

let existing = "";
try { existing = readFileSync(COLLECTIONS_ENV_PATH, "utf-8"); } catch { /* new file */ }
function upsert(content: string, name: string, value: string): string {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  return pattern.test(content) ? content.replace(pattern, line) : content.trimEnd() + "\n" + line + "\n";
}
let updated = upsert(existing, "KEYCHAIN_PRIVATE_KEY_PATH", privKeyPath);
updated = upsert(updated, "KEYCHAIN_PUBLIC_KEY_B64", Buffer.from(publicKey, "utf-8").toString("base64"));
writeFileSync(COLLECTIONS_ENV_PATH, updated);

console.log(`kid: ${kid}`);
console.log(`Public key  written to ${pubKeyPath}`);
console.log(`Private key written to ${privKeyPath}`);
console.log(`Bruno env written to ${COLLECTIONS_ENV_PATH}`);
