-- Grant read access to authorization_server_user on keychain readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_keychain TO ${NAMESPACE}_authorization_server_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_keychain TO ${NAMESPACE}_authorization_server_user;
