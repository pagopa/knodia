import { listAttributes } from "@knodia/attribute-models";
import { Banner, Modal } from "@knodia/ui-kit/ui";

import { toSchemeRefKey } from "@/utils/schemeRef";

import { DefinitionCard } from "./DefinitionCard";
import { ModalScrollArea } from "./ModalScrollArea";

const ORGS_PERSONAL_ATTRIBUTES_INFO =
  "In this prototype, each Organization has a unique identifying attribute. These attributes can be used, for testing purposes, to create E-Services accessible only to specific Organizations, by searching for and selecting the Organizations' names in the attribute group selector.";

interface AttributesListModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AttributesListModal({
  isOpen,
  onOpenChange,
}: AttributesListModalProps) {
  return (
    <Modal
      isDismissable
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Attributes list"
    >
      <ModalScrollArea className="gap-4">
        <p className="title-sm text-primary-light-low-contrast">
          Main attributes
        </p>
        <div className="flex flex-col gap-2">
          {listAttributes().map((attribute) => (
            <DefinitionCard
              description={attribute.description}
              key={toSchemeRefKey(attribute.id)}
              name={attribute.name}
            />
          ))}
        </div>
        <p className="title-sm text-primary-light-low-contrast">
          Orgs personal attributes
        </p>
        <Banner kind="informative">{ORGS_PERSONAL_ATTRIBUTES_INFO}</Banner>
      </ModalScrollArea>
    </Modal>
  );
}
