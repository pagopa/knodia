-- Mock e-services producer (publisher) for the orion knode — the only org seeded here
-- (testing env ~ prod) and the org the login mock points to. Consumption is cross-knode
-- (each knode's publisher consumes the other knode's e-services), so it carries
-- testing_organization to satisfy the mocks' required attribute.
-- ${NAMESPACE} is substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000004', 'Mockup Confederate Organization Orion', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('00000000-0000-4000-8000-000000000004', 'knodia', 'testing_organization', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;
