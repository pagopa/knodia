-- Add template_id and template_knode_id to eservice read model
ALTER TABLE ${NAMESPACE}_eservice."eservice"
  ADD COLUMN "template_id" uuid,
  ADD COLUMN "template_knode_id" text,
  ADD CONSTRAINT "eservice_template_fields_check"
    CHECK (("template_id" IS NULL) = ("template_knode_id" IS NULL));
