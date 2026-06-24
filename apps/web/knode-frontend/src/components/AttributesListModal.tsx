import {
  type Attribute,
  attributes,
  getAttribute,
} from "@knodia/attribute-models";
import { Banner, Modal } from "@knodia/ui-kit/ui";

import { DefinitionCard } from "./DefinitionCard";

const ORGS_PERSONAL_ATTRIBUTES_INFO =
  "In this prototype, each Organization has a unique identifying attribute. These attributes can be used, for testing purposes, to create E-Services accessible only to specific Organizations, by searching for and selecting the Organizations' names in the attribute group selector.";

const catalogAttributes: Attribute[] = Object.entries(attributes).flatMap(
  ([scheme, codes]) =>
    Object.keys(codes)
      .map((code) => getAttribute({ code, scheme }))
      .filter((attribute): attribute is Attribute => attribute !== undefined),
);

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
      onDismiss={() => onOpenChange(false)}
      onOpenChange={onOpenChange}
      title="Attributes list"
    >
      <div className="flex flex-col gap-4">
        <p className="title-sm text-primary-light-low-contrast">
          Main attributes
        </p>
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {catalogAttributes.map((attribute) => (
            <DefinitionCard
              description={attribute.description}
              key={`${attribute.id.scheme}$${attribute.id.code}`}
              name={attribute.name}
            />
          ))}
        </div>
        <p className="title-sm text-primary-light-low-contrast">
          Orgs personal attributes
        </p>
        <Banner kind="informative">{ORGS_PERSONAL_ATTRIBUTES_INFO}</Banner>
      </div>
    </Modal>
  );
}
