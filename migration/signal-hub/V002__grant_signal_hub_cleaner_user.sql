-- Grant access to signal_hub_cleaner_user on signal_hub schema
GRANT USAGE ON SCHEMA ${NAMESPACE}_signal_hub TO ${NAMESPACE}_signal_hub_cleaner_user;
GRANT SELECT, DELETE ON ALL TABLES IN SCHEMA ${NAMESPACE}_signal_hub TO ${NAMESPACE}_signal_hub_cleaner_user;
