-- Grant read access to authorization_server_user on agreement readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_authorization_server_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_authorization_server_user;
