-- Grant read access to signal_hub_user on eservice readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_eservice TO ${NAMESPACE}_signal_hub_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_eservice TO ${NAMESPACE}_signal_hub_user;
