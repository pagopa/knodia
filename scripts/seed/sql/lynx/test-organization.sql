-- Test Organization (lynx knode): the org real users log into via the dev cognito
-- group "org:bade84f5-45ad-4e8f-a8cd-9c54aae162dc", created manually but never seeded
-- into the read model. Only the testing_organization attribute, so it can consume
-- every mock e-service.
-- ${NAMESPACE} is substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('bade84f5-45ad-4e8f-a8cd-9c54aae162dc', 'Test Organization', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('bade84f5-45ad-4e8f-a8cd-9c54aae162dc', 'knodia', 'testing_organization', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;
