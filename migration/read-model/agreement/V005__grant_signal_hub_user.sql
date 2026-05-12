-- Grant read access to signal_hub_user on agreement readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_signal_hub_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_signal_hub_user;
