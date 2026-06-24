import type { Attribute } from "@knodia/attribute-models";

import { Modal } from "@knodia/ui-kit/ui";

import { DefinitionCard } from "./DefinitionCard";

interface AttributeDescriptionModalProps {
  attribute: Attribute | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AttributeDescriptionModal({
  attribute,
  isOpen,
  onOpenChange,
}: AttributeDescriptionModalProps) {
  return (
    <Modal
      isDismissable
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Attribute description"
    >
      {attribute && (
        <DefinitionCard
          description={attribute.description}
          name={attribute.name}
        />
      )}
    </Modal>
  );
}
