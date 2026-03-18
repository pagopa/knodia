-- Grant read access to purpose_process_user on agreement readmodel
GRANT USAGE ON SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_purpose_process_user;
GRANT SELECT ON ALL TABLES IN SCHEMA ${NAMESPACE}_agreement TO ${NAMESPACE}_purpose_process_user;
