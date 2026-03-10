-- Grant privileges to ${NAMESPACE}_organization_rmw_user
GRANT USAGE ON SCHEMA ${NAMESPACE}_organization TO ${NAMESPACE}_organization_rmw_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${NAMESPACE}_organization TO ${NAMESPACE}_organization_rmw_user;
