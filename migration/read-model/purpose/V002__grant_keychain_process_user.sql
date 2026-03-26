-- Grant read access to keychain_process_user on purpose readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_keychain_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_keychain_process_user;
