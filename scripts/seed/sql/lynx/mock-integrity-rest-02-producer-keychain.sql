-- Producer keychain + public key for the Lynx Mockup 06 Integrity REST 02 mock,
-- so GET /producerKeys/:kid resolves and the Knodia-JWT-Signature verifies without
-- the manual "create keychain + upload key" step.
--
-- ${NAMESPACE} is substituted by seed.sh via sed. ${KID} and ${ENCODED_PEM} are the
-- mock's signing key, derived from KMS by scripts/seed/derive-integrity-producer-key.ts
-- and provided to seed.sh at runtime — the kid matches because both this seed and the
-- mock compute it as calculateKid() over the same public key. seed.sh skips this file
-- when ${KID} is absent (e.g. tenants without the integrity mock).

INSERT INTO ${NAMESPACE}_keychain."producer_keychain" (
  id, owner_id, name, description, metadata_version, created_at, updated_at
) VALUES (
  'f0f0f0f0-0000-4000-8000-000000000006',
  '00000000-0000-4000-8000-000000000004',
  '{"en": "Mockup 06 Integrity REST 02 — Producer Keychain"}'::jsonb,
  NULL,
  0, now(), now()
) ON CONFLICT (id) DO UPDATE SET
  owner_id = EXCLUDED.owner_id,
  name = EXCLUDED.name,
  updated_at = now();

INSERT INTO ${NAMESPACE}_keychain."producer_keychain_key" (
  producer_keychain_id, kid, algorithm, encoded_pem, format, name, user_id,
  metadata_version, created_at
) VALUES (
  'f0f0f0f0-0000-4000-8000-000000000006',
  '${KID}',
  'RS256',
  '${ENCODED_PEM}',
  'PublicKey',
  '{"en": "Integrity REST 02 signing key"}'::jsonb,
  '00000000-0000-4000-8000-000000000004',
  0, now()
) ON CONFLICT (producer_keychain_id, kid) DO UPDATE SET
  encoded_pem = EXCLUDED.encoded_pem,
  algorithm = EXCLUDED.algorithm,
  format = EXCLUDED.format,
  name = EXCLUDED.name,
  user_id = EXCLUDED.user_id;

INSERT INTO ${NAMESPACE}_keychain."producer_keychain_user" (
  producer_keychain_id, user_id, metadata_version, added_at
) VALUES (
  'f0f0f0f0-0000-4000-8000-000000000006',
  '00000000-0000-4000-8000-000000000004',
  0, now()
) ON CONFLICT (user_id, metadata_version, producer_keychain_id) DO NOTHING;

INSERT INTO ${NAMESPACE}_keychain."producer_keychain_eservice" (
  producer_keychain_id, eservice_id, metadata_version, linked_at
) VALUES (
  'f0f0f0f0-0000-4000-8000-000000000006',
  'cf9dde0a-336a-43e0-a5f7-14b698a0586e',
  0, now()
) ON CONFLICT (eservice_id, metadata_version, producer_keychain_id) DO NOTHING;
