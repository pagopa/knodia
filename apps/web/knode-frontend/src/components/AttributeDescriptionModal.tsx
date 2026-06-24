import { type AttributeId, getAttribute } from "@knodia/attribute-models";
import { Modal } from "@knodia/ui-kit/ui";

import { DefinitionCard } from "./DefinitionCard";

interface AttributeDescriptionModalProps {
  attribute: AttributeId | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AttributeDescriptionModal({
  attribute,
  isOpen,
  onOpenChange,
}: AttributeDescriptionModalProps) {
  const resolved = attribute ? getAttribute(attribute) : undefined;

  return (
    <Modal
      isDismissable
      isOpen={isOpen}
      onDismiss={() => onOpenChange(false)}
      onOpenChange={onOpenChange}
      title="Attribute description"
    >
      {resolved && (
        <DefinitionCard
          description={resolved.description}
          name={resolved.name}
        />
      )}
    </Modal>
  );
}
