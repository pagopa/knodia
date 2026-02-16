import { generateKeyPairSync, createPublicKey } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const KEYS_DIR = "/keys";

const keysets = ["cognito", "session"];

const allKeysExist = keysets.every(
  (name) =>
    existsSync(`${KEYS_DIR}/${name}/private.pem`) &&
    existsSync(`${KEYS_DIR}/${name}/public.pem`)
);

if (allKeysExist) {
  console.log("All keys already exist, skipping generation.");
  process.exit(0);
}

for (const name of keysets) {
  const dir = `${KEYS_DIR}/${name}`;
  mkdirSync(dir, { recursive: true });

  console.log(`Generating RSA key pair for "${name}"...`);

  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  writeFileSync(
    `${dir}/private.pem`,
    privateKey.export({ type: "pkcs8", format: "pem" })
  );
  writeFileSync(
    `${dir}/public.pem`,
    publicKey.export({ type: "spki", format: "pem" })
  );
}

// Generate JWKS JSON files from public keys
for (const name of keysets) {
  const dir = `${KEYS_DIR}/jwks/${name}/.well-known`;
  mkdirSync(dir, { recursive: true });

  const publicKeyPem = readFileSync(`${KEYS_DIR}/${name}/public.pem`, "utf-8");
  const publicKey = createPublicKey(publicKeyPem);
  const jwk = publicKey.export({ format: "jwk" });

  const jwks = {
    keys: [{ ...jwk, kid: `local-${name}-key`, use: "sig", alg: "RS256" }],
  };

  writeFileSync(`${dir}/jwks.json`, JSON.stringify(jwks, null, 2));
  console.log(`JWKS written for "${name}"`);
}

console.log("KMS setup complete.");
