-- Idempotent migration: create roles for event-store (local development only)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'local_eservice_process_user') THEN
        CREATE ROLE local_eservice_process_user WITH LOGIN PASSWORD 'local_eservice_process_user';
    END IF;
END
$$;
