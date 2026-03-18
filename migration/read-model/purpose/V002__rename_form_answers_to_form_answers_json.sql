-- Placeholders: ${NAMESPACE} - environment prefix resolved by Flyway at runtime

ALTER TABLE ${NAMESPACE}_purpose."purpose"
    RENAME COLUMN "form_answers" TO "form_answers_json";
