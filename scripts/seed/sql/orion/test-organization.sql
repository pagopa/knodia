-- Test Organization (orion knode): the org real users log into via the dev cognito
-- group "org:d5a0decf-f6e9-4ee1-a2e8-43db2b910416", created manually but never seeded
-- into the read model. Only the testing_organization attribute, so it can consume
-- every mock e-service. Also the org the local login mock uses
-- (scripts/local-auth/local-cognito.mjs and generate-token.mjs).
-- ${NAMESPACE} is substituted at runtime by seed.sh via sed.

INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('d5a0decf-f6e9-4ee1-a2e8-43db2b910416', 'Test Organization', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO ${NAMESPACE}_organization."organization_attribute" (organization_id, scheme, code, metadata_version)
VALUES ('d5a0decf-f6e9-4ee1-a2e8-43db2b910416', 'knodia', 'testing_organization', 0)
ON CONFLICT ON CONSTRAINT organization_attribute_pk DO NOTHING;
