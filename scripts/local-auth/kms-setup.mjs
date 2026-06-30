import {
  KMSClient,
  CreateKeyCommand,
  CreateAliasCommand,
  DescribeKeyCommand,
  GetPublicKeyCommand,
} from "@aws-sdk/client-kms";
import { createPublicKey } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

const KMS_ENDPOINT = process.env.KMS_ENDPOINT ?? "http://localhost:4566";
const JWKS_OUTPUT_DIR = process.env.JWKS_OUTPUT_DIR ?? "/jwks";

const kmsClient = new KMSClient({
  endpoint: KMS_ENDPOINT,
  region: "eu-south-1",
  credentials: { accessKeyId: "testawskey", secretAccessKey: "testawssecret" },
});

// KMS keys for knodia services (ui-session, internal, etc.), published in the JWKS
// served by the local-jwks container for token validation.
const jwksKids = [
  "alias/local-knodia-key",
  "alias/local-knodia-auth-server-key",
  "alias/local-knodia-maintenance-key",
];

// Dedicated key the mock-eservice signs Knodia-JWT-Signature with. Kept out of the
// JWKS — it's validated via the seeded producer keychain, not the platform JWKS.
const INTEGRITY_PRODUCER_KEY_ALIAS = "alias/local-knodia-integrity-rest-02-key";

const jwksDir = `${JWKS_OUTPUT_DIR}/knodia/.well-known`;
mkdirSync(jwksDir, { recursive: true });

const allJwks = [];

for (const KID of [...jwksKids, INTEGRITY_PRODUCER_KEY_ALIAS]) {
  try {
    await kmsClient.send(new DescribeKeyCommand({ KeyId: KID }));
    console.log(`Key "${KID}" already exists.`);
  } catch {
    console.log(`Creating KMS key "${KID}"...`);

    const { KeyMetadata } = await kmsClient.send(
      new CreateKeyCommand({
        KeySpec: "RSA_2048",
        KeyUsage: "SIGN_VERIFY",
        Description: `Local development key ${KID}`,
      })
    );

    await kmsClient.send(
      new CreateAliasCommand({
        AliasName: KID,
        TargetKeyId: KeyMetadata.KeyId,
      })
    );
    console.log(`Key "${KID}" created.`);
  }

  if (!jwksKids.includes(KID)) {
    continue;
  }

  const { PublicKey: publicKeyDer } = await kmsClient.send(
    new GetPublicKeyCommand({ KeyId: KID })
  );

  const publicKey = createPublicKey({
    key: Buffer.from(publicKeyDer),
    format: "der",
    type: "spki",
  });
  const jwk = publicKey.export({ format: "jwk" });

  allJwks.push({ ...jwk, kid: KID, use: "sig", alg: "RS256" });
  console.log(`JWK collected for "${KID}"`);
}

const jwks = { keys: allJwks };
writeFileSync(`${jwksDir}/jwks.json`, JSON.stringify(jwks, null, 2));
console.log(`JWKS written with ${allJwks.length} key(s)`);

console.log("KMS setup complete.");
