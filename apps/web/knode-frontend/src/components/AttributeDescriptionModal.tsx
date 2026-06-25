import type { Attribute } from "@knodia/attribute-models";

import { Modal } from "@knodia/ui-kit/ui";

import { DefinitionCard } from "./DefinitionCard";

interface AttributeDescriptionModalProps {
  attribute: Attribute;
}

export function AttributeDescriptionModal({
  attribute,
}: AttributeDescriptionModalProps) {
  return (
    <Modal isDismissable title="Attribute description">
      <DefinitionCard
        description={attribute.description}
        name={attribute.name}
      />
    </Modal>
  );
}
