import { Banner, Modal } from "@knodia/ui-kit/ui";

import { DefinitionCard } from "./DefinitionCard";

interface AttributeDescriptionModalProps {
  description: string;
  name: string;
  // Org-unique attributes have no catalogue entry, so their shared explanatory
  // copy is shown as an info banner rather than a definition card.
  variant?: "definition" | "info";
}

export function AttributeDescriptionModal({
  description,
  name,
  variant = "definition",
}: AttributeDescriptionModalProps) {
  return (
    <Modal isDismissable title="Attribute description">
      {variant === "info" ? (
        <Banner kind="informative">{description}</Banner>
      ) : (
        <DefinitionCard description={description} name={name} />
      )}
    </Modal>
  );
}
