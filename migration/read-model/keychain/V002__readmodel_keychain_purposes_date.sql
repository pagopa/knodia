ALTER TABLE ${NAMESPACE}_keychain."consumer_keychain_purpose"
ADD COLUMN "created_at" timestamp with time zone NOT NULL DEFAULT now();
