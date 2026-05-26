-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime
--
-- The mock e-service writes Signal Hub signals directly to the `signal` table
-- from an in-process emitter (prototype simplification — bypasses auth + Push
-- API). It needs INSERT on the table, SELECT for the max(signal_id) bootstrap
-- read, and USAGE on the BIGSERIAL sequence backing the `id` primary key.

GRANT USAGE ON SCHEMA ${NAMESPACE}_signal_hub TO ${NAMESPACE}_mock_eservice_user;
GRANT SELECT, INSERT ON TABLE ${NAMESPACE}_signal_hub."signal" TO ${NAMESPACE}_mock_eservice_user;
GRANT USAGE ON SEQUENCE ${NAMESPACE}_signal_hub.signal_id_seq TO ${NAMESPACE}_mock_eservice_user;
