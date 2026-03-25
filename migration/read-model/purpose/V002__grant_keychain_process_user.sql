-- Grant read access to purpose_process_user on eservice readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_keychain_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_keychain_process_user;
