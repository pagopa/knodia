-- Grant read access to authorization_server_user on purpose readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_authorization_server_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_authorization_server_user;
