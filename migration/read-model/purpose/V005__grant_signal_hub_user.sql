-- Grant read access to signal_hub_user on purpose readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_signal_hub_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_purpose TO ${NAMESPACE}_signal_hub_user;
