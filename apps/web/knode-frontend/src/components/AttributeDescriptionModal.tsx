import { Modal } from "@knodia/ui-kit/ui";

import { DefinitionCard } from "./DefinitionCard";

interface AttributeDescriptionModalProps {
  description: string;
  name: string;
}

export function AttributeDescriptionModal({
  description,
  name,
}: AttributeDescriptionModalProps) {
  return (
    <Modal isDismissable title="Attribute description">
      <DefinitionCard description={description} name={name} />
    </Modal>
  );
}
