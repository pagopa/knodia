-- Organization IDs match scripts/local-auth/local-cognito.mjs and generate-token.mjs.
-- ${NAMESPACE} is substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000002', 'Test Org Lynx 1', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000003', 'Test Org Lynx 2', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000004', 'Mockup Confederate Organization Lynx', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000005', 'Test Org Lynx 4', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('00000000-0000-4000-8000-000000000002', 'vc_territorial_units', 'nuts3', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('00000000-0000-4000-8000-000000000003', 'vc_territorial_units', 'nuts2', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('00000000-0000-4000-8000-000000000004', 'vc_territorial_units', 'nuts1', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('00000000-0000-4000-8000-000000000005', 'vc_territorial_units', 'nuts1', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;
