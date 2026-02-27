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

// KMS key for knodia services (ui-session, internal, etc.)
// JWKS is written to disk and served by the local-jwks nginx container.
const KID = "alias/local-knodia-key";

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

  const { PublicKey: publicKeyDer } = await kmsClient.send(
    new GetPublicKeyCommand({ KeyId: KID })
  );

  const publicKey = createPublicKey({
    key: Buffer.from(publicKeyDer),
    format: "der",
    type: "spki",
  });
  const jwk = publicKey.export({ format: "jwk" });

  const jwks = {
    keys: [{ ...jwk, kid: KID, use: "sig", alg: "RS256" }],
  };

  const jwksDir = `${JWKS_OUTPUT_DIR}/knodia/.well-known`;
  mkdirSync(jwksDir, { recursive: true });
  writeFileSync(`${jwksDir}/jwks.json`, JSON.stringify(jwks, null, 2));
  console.log(`JWKS written for "${KID}"`);

console.log("KMS setup complete.");
