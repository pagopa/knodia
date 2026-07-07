DO $$
DECLARE
    role_name text;
    role_names text[] := ARRAY[
        '${NAMESPACE}_eservice_process_user',
        '${NAMESPACE}_eservice_rmw_user',
        '${NAMESPACE}_agreement_process_user',
        '${NAMESPACE}_agreement_rmw_user',
        '${NAMESPACE}_keychain_process_user',
        '${NAMESPACE}_keychain_rmw_user',
        '${NAMESPACE}_remote_resources_manager_user',
        '${NAMESPACE}_organization_process_user',
        '${NAMESPACE}_organization_rmw_user',
        '${NAMESPACE}_purpose_process_user',
        '${NAMESPACE}_purpose_rmw_user',
        '${NAMESPACE}_authorization_server_user',
        '${NAMESPACE}_signal_hub_user',
        '${NAMESPACE}_signal_hub_cleaner_user',
        '${NAMESPACE}_mock_eservice_user',
        '${NAMESPACE}_signup_manager_user',
        '${NAMESPACE}_signup_updater_user',
        '${NAMESPACE}_signup_suspended_users_notifier_user'
    ];
BEGIN
    FOREACH role_name IN ARRAY role_names LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
            EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L', role_name, role_name);
        END IF;
    END LOOP;
END
$$;
