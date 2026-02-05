-- Flyway repeatable migration: R__grants.sql
-- Manages roles and grants for the event-store eservice schema
-- Placeholders: ${namespace} - environment prefix, ${default_password} - password for service users

-- =============================================================================
-- 1. Create roles if they do not exist (idempotent)
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly_user') THEN
        CREATE ROLE readonly_user WITH LOGIN PASSWORD '${default_password}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_user') THEN
        CREATE ROLE admin_user WITH LOGIN PASSWORD '${default_password}';
    END IF;

    -- Service users: one per deployed service (${namespace}_<service_name>)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${namespace}_eservice_process') THEN
        CREATE ROLE ${namespace}_eservice_process WITH LOGIN PASSWORD '${default_password}';
    END IF;
END
$$;

-- =============================================================================
-- 2. readonly_user — SELECT only
-- =============================================================================

GRANT USAGE ON SCHEMA ${namespace}_eservice TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${namespace}_eservice TO readonly_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA ${namespace}_eservice
    GRANT SELECT ON TABLES TO readonly_user;

-- =============================================================================
-- 3. admin_user — full privileges
-- =============================================================================

GRANT ALL PRIVILEGES ON SCHEMA ${namespace}_eservice TO admin_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${namespace}_eservice TO admin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${namespace}_eservice TO admin_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA ${namespace}_eservice
    GRANT ALL PRIVILEGES ON TABLES TO admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA ${namespace}_eservice
    GRANT ALL PRIVILEGES ON SEQUENCES TO admin_user;

-- =============================================================================
-- 4. ${namespace}_eservice_process — INSERT + SELECT (writes and reads events)
--    Add a new section here for each new service that needs access
-- =============================================================================

GRANT USAGE ON SCHEMA ${namespace}_eservice TO ${namespace}_eservice_process;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA ${namespace}_eservice TO ${namespace}_eservice_process;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${namespace}_eservice TO ${namespace}_eservice_process;

ALTER DEFAULT PRIVILEGES IN SCHEMA ${namespace}_eservice
    GRANT SELECT, INSERT ON TABLES TO ${namespace}_eservice_process;
ALTER DEFAULT PRIVILEGES IN SCHEMA ${namespace}_eservice
    GRANT USAGE, SELECT ON SEQUENCES TO ${namespace}_eservice_process;
