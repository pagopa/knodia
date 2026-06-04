-- Grant read access to keychain_process_user on eservice readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_eservice TO ${NAMESPACE}_keychain_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_eservice TO ${NAMESPACE}_keychain_process_user;
