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

const keysets = ["cognito", "session"];

for (const name of keysets) {
  const aliasName = `alias/local-${name}-key`;

  try {
    // Check if key already exists via alias
    await kmsClient.send(new DescribeKeyCommand({ KeyId: aliasName }));
    console.log(`Key "${name}" already exists.`);
  } catch {
    // Key doesn't exist — create it
    console.log(`Creating KMS key for "${name}"...`);

    const { KeyMetadata } = await kmsClient.send(
      new CreateKeyCommand({
        KeySpec: "RSA_2048",
        KeyUsage: "SIGN_VERIFY",
        Description: `Local development key for ${name}`,
      })
    );

    await kmsClient.send(
      new CreateAliasCommand({
        AliasName: aliasName,
        TargetKeyId: KeyMetadata.KeyId,
      })
    );
    console.log(`Key "${name}" created.`);
  }

  // Get public key and build JWKS
  const { PublicKey: publicKeyDer } = await kmsClient.send(
    new GetPublicKeyCommand({ KeyId: aliasName })
  );

  const publicKey = createPublicKey({
    key: Buffer.from(publicKeyDer),
    format: "der",
    type: "spki",
  });
  const jwk = publicKey.export({ format: "jwk" });

  const jwks = {
    keys: [{ ...jwk, kid: `local-${name}-key`, use: "sig", alg: "RS256" }],
  };

  // Write JWKS to output directory
  const jwksDir = `${JWKS_OUTPUT_DIR}/${name}/.well-known`;
  mkdirSync(jwksDir, { recursive: true });
  writeFileSync(`${jwksDir}/jwks.json`, JSON.stringify(jwks, null, 2));
  console.log(`JWKS written for "${name}"`);
}

console.log("KMS setup complete.");
