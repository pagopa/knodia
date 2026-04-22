-- Add template_id to eservice read model
ALTER TABLE ${NAMESPACE}_eservice."eservice"
  ADD COLUMN "template_id" uuid;
