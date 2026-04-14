ALTER TABLE ${NAMESPACE}_keychain."consumer_keychain_user"
ADD COLUMN "added_at" timestamp with time zone NOT NULL DEFAULT now();
