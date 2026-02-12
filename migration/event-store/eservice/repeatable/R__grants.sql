-- Flyway repeatable migration: R__grants.sql
-- Manages roles and grants for the event-store eservice schema
-- Placeholders: ${NAMESPACE} - environment prefix, ${DEFAULT_PASSWORD} - password for service users

-- =============================================================================
-- 1. Create roles if they do not exist (idempotent)
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly_user') THEN
        CREATE ROLE readonly_user WITH LOGIN PASSWORD '${DEFAULT_PASSWORD}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_user') THEN
        CREATE ROLE admin_user WITH LOGIN PASSWORD '${DEFAULT_PASSWORD}';
    END IF;

    -- Service users: one per deployed service (${NAMESPACE}_<service_name>)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${NAMESPACE}_eservice_process_user') THEN
        CREATE ROLE ${NAMESPACE}_eservice_process_user WITH LOGIN PASSWORD '${DEFAULT_PASSWORD}';
    END IF;
END
$$;

-- =============================================================================
-- 2. readonly_user — SELECT only
-- =============================================================================

GRANT USAGE ON SCHEMA ${NAMESPACE}_eservice TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_eservice TO readonly_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA ${NAMESPACE}_eservice
    GRANT SELECT ON TABLES TO readonly_user;

-- =============================================================================
-- 3. admin_user — full privileges
-- =============================================================================

GRANT ALL PRIVILEGES ON SCHEMA ${NAMESPACE}_eservice TO admin_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${NAMESPACE}_eservice TO admin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${NAMESPACE}_eservice TO admin_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA ${NAMESPACE}_eservice
    GRANT ALL PRIVILEGES ON TABLES TO admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA ${NAMESPACE}_eservice
    GRANT ALL PRIVILEGES ON SEQUENCES TO admin_user;

-- =============================================================================
-- 4. ${NAMESPACE}_eservice_process_user — INSERT + SELECT (writes and reads events)
--    Add a new section here for each new service that needs access
-- =============================================================================

GRANT USAGE ON SCHEMA ${NAMESPACE}_eservice TO ${NAMESPACE}_eservice_process_user;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA ${NAMESPACE}_eservice TO ${NAMESPACE}_eservice_process_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${NAMESPACE}_eservice TO ${NAMESPACE}_eservice_process_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA ${NAMESPACE}_eservice
    GRANT SELECT, INSERT ON TABLES TO ${NAMESPACE}_eservice_process_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA ${NAMESPACE}_eservice
    GRANT USAGE, SELECT ON SEQUENCES TO ${NAMESPACE}_eservice_process_user;
