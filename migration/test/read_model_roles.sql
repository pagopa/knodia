-- Idempotent migration: create roles for read-model (test only)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_eservice_rmw_user') THEN
        CREATE ROLE test_eservice_rmw_user WITH LOGIN PASSWORD 'test_eservice_rmw_user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_eservice_process_user') THEN
        CREATE ROLE test_eservice_process_user WITH LOGIN PASSWORD 'test_eservice_process_user';
    END IF;
END
$$;
