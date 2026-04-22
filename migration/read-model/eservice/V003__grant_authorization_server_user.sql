-- Grant read access to authorization_server_user on eservice readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_eservice TO ${NAMESPACE}_authorization_server_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_eservice TO ${NAMESPACE}_authorization_server_user;
