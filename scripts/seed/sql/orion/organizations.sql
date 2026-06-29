-- Mock e-services producer organization (publisher) for the orion knode.
-- The testing env mirrors prod, so only the mock publisher is seeded here; the
-- consumer test org lives in test-organization.sql.
-- ${NAMESPACE} is substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000004', 'Mockup Confederate Organization Orion', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('00000000-0000-4000-8000-000000000004', 'knodia', 'testing_organization', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;
