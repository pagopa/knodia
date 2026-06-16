-- POC Use Case 01 — producer side (Lynx).
-- Organization IDs match scripts/local-auth/local-cognito.mjs and generate-token.mjs.
-- ${NAMESPACE} is substituted at runtime by seed.sh via sed.

-- studentRegistryLynx publishes the qualifications eservices on Lynx.
INSERT INTO ${NAMESPACE}_organization."organization" (id, name, metadata_version, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000103', 'Student Registry Lynx', 0, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();
