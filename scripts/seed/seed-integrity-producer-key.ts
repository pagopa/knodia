// Seeds the Integrity REST 02 producer keychain + public key so
// GET /producerKeys/:kid resolves and the Knodia-JWT-Signature verifies.
//
// Derive the key from KMS at runtime (no committed/static material): the mock signs
// with the key behind INTEGRITY_REST_02_SIGNATURE_KID, which differs per env and is
// regenerated on every local `down -v` — deriving here keeps the seeded kid matching
// the signer. Written straight to the readmodel, like the e-service seed (fixture, no
// command path).

import { GetPublicKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { createHash, createPublicKey } from "node:crypto";
import { Pool } from "pg";

// Mirror of @knodia/crypto.calculateKid (inlined to avoid pulling the crypto →
// common-models TS chain into a standalone node script). Must stay byte-identical:
// SHA-256 over the JWK with all members sorted, base64url. The mock computes the
// JWT header kid the same way, so the seeded kid matches.
const calculateKid = (jwk: Record<string, unknown>): string => {
  const sorted = Object.keys(jwk)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => ({ ...acc, [k]: jwk[k] }), {});
  return createHash("sha256").update(JSON.stringify(sorted)).digest("base64url");
};

const env = (name: string, fallback?: string): string => {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var ${name}`);
  return v;
};

const alias = env("INTEGRITY_PRODUCER_KEY_KMS_ALIAS");
const namespace = env("NAMESPACE");
if (!/^[a-z0-9_]+$/.test(namespace)) {
  throw new Error(`Unsafe NAMESPACE '${namespace}'`);
}
const schema = `${namespace}_keychain`;

// Fixed fixture IDs. user/owner default to the producer org (the local Lynx
// ui-session sub used by the manual flow); the e-service id matches the seeded mock.
const keychainId = env("INTEGRITY_PRODUCER_KEYCHAIN_ID", "f0f0f0f0-0000-4000-8000-000000000006");
const ownerId = env("INTEGRITY_PRODUCER_KEY_USER_ID", "00000000-0000-4000-8000-000000000004");
const eserviceId = env("INTEGRITY_PRODUCER_ESERVICE_ID", "cf9dde0a-336a-43e0-a5f7-14b698a0586e");
const keychainName = JSON.stringify({ en: "Mockup 06 Integrity REST 02 — Producer Keychain" });
const keyName = JSON.stringify({ en: "Integrity REST 02 signing key" });

const kms = new KMSClient({
  endpoint: process.env.AWS_ENDPOINT_URL_KMS,
  region: env("AWS_REGION", "eu-south-1"),
});

const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: alias }));
if (!PublicKey) throw new Error(`No public key for KMS alias '${alias}'`);

const publicKey = createPublicKey({ key: Buffer.from(PublicKey), format: "der", type: "spki" });
const encodedPem = Buffer.from(
  publicKey.export({ format: "pem", type: "spki" }).toString(),
).toString("base64");
const kid = calculateKid(publicKey.export({ format: "jwk" }) as Record<string, unknown>);

const pool = new Pool({
  database: env("PGDATABASE"),
  host: env("PGHOST", "localhost"),
  password: env("PGPASSWORD", "root"),
  port: Number(env("PGPORT", "5432")),
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
  user: env("PGUSER", "root"),
});

const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query(
    `INSERT INTO "${schema}".producer_keychain
       (id, owner_id, name, description, metadata_version, created_at, updated_at)
     VALUES ($1, $2, $3::jsonb, NULL, 0, now(), now())
     ON CONFLICT (id) DO UPDATE SET owner_id = EXCLUDED.owner_id, name = EXCLUDED.name, updated_at = now()`,
    [keychainId, ownerId, keychainName],
  );
  await client.query(
    `INSERT INTO "${schema}".producer_keychain_key
       (producer_keychain_id, kid, algorithm, encoded_pem, format, name, user_id, metadata_version, created_at)
     VALUES ($1, $2, 'RS256', $3, 'PublicKey', $4::jsonb, $5, 0, now())
     ON CONFLICT (producer_keychain_id, kid) DO UPDATE
       SET encoded_pem = EXCLUDED.encoded_pem, algorithm = EXCLUDED.algorithm,
           format = EXCLUDED.format, name = EXCLUDED.name, user_id = EXCLUDED.user_id`,
    [keychainId, kid, encodedPem, keyName, ownerId],
  );
  await client.query(
    `INSERT INTO "${schema}".producer_keychain_user
       (producer_keychain_id, user_id, metadata_version, added_at)
     VALUES ($1, $2, 0, now())
     ON CONFLICT (user_id, metadata_version, producer_keychain_id) DO NOTHING`,
    [keychainId, ownerId],
  );
  await client.query(
    `INSERT INTO "${schema}".producer_keychain_eservice
       (producer_keychain_id, eservice_id, metadata_version, linked_at)
     VALUES ($1, $2, 0, now())
     ON CONFLICT (eservice_id, metadata_version, producer_keychain_id) DO NOTHING`,
    [keychainId, eserviceId],
  );
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
  await pool.end();
}

console.log(`Seeded Integrity REST 02 producer key into ${schema} (kid=${kid})`);
