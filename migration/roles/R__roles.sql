DO $$
DECLARE
    role_name text;
    role_names text[] := ARRAY[
        '${NAMESPACE}_eservice_process_user',
        '${NAMESPACE}_eservice_rmw_user',
        '${NAMESPACE}_keychain_rmw_user',
        '${NAMESPACE}_keychain_rmw_user'
    ];
BEGIN
    FOREACH role_name IN ARRAY role_names LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
            EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L', role_name, role_name);
        END IF;
    END LOOP;
END
$$;
