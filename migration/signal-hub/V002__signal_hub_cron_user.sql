-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime
--
-- Cron job for the Signal Hub mock e-service writes directly to the signal
-- table (prototype simplification — bypasses auth + Push API). It needs
-- INSERT on the table, SELECT for the max(signal_id) bootstrap read, and
-- USAGE on the BIGSERIAL sequence backing the `id` primary key.

GRANT USAGE  ON SCHEMA   ${NAMESPACE}_signal_hub TO ${NAMESPACE}_signal_hub_cron_user;
GRANT SELECT ON TABLE    ${NAMESPACE}_signal_hub."signal" TO ${NAMESPACE}_signal_hub_cron_user;
GRANT INSERT ON TABLE    ${NAMESPACE}_signal_hub."signal" TO ${NAMESPACE}_signal_hub_cron_user;
GRANT USAGE  ON SEQUENCE ${NAMESPACE}_signal_hub.signal_id_seq TO ${NAMESPACE}_signal_hub_cron_user;
