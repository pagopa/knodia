-- Idempotent migration: create roles for read-model eservice (local development only)
-- Placeholders: ${NAMESPACE} - environment prefix, ${DEFAULT_PASSWORD} - password for service users

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly_user') THEN
        CREATE ROLE readonly_user WITH LOGIN PASSWORD '${DEFAULT_PASSWORD}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${NAMESPACE}_backend_for_frontend_user') THEN
        CREATE ROLE ${NAMESPACE}_backend_for_frontend_user WITH LOGIN PASSWORD '${DEFAULT_PASSWORD}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${NAMESPACE}_eservice_readmodel_writer_user') THEN
        CREATE ROLE ${NAMESPACE}_eservice_readmodel_writer_user WITH LOGIN PASSWORD '${DEFAULT_PASSWORD}';
    END IF;
END
$$;
