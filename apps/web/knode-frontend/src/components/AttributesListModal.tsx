import type { Attribute } from "@knodia/attribute-models";

import { Banner, Modal } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

import { ORGS_PERSONAL_ATTRIBUTES_INFO } from "@/utils/attributeCopy";
import { toSchemeRefKey } from "@/utils/schemeRef";

import { DefinitionCard } from "./DefinitionCard";

// Which E-Service creation flow the modal is shown in: from scratch or from a template.
type AttributesListVariant = "scratch" | "template";

export function AttributesListModal({
  attributes,
  variant,
}: {
  attributes: readonly Attribute[];
  variant: AttributesListVariant;
}) {
  const showCatalogSections = match(variant)
    .with("scratch", () => true)
    .with("template", () => false)
    .exhaustive();

  return (
    <Modal isDismissable title="Attributes list">
      <div className="flex flex-col gap-4">
        {showCatalogSections && (
          <p className="title-sm text-primary-light-low-contrast">
            Main attributes
          </p>
        )}
        <div className="flex flex-col gap-2">
          {attributes.map((attribute) => (
            <DefinitionCard
              description={attribute.description}
              key={toSchemeRefKey(attribute.id)}
              name={attribute.name}
            />
          ))}
        </div>
        {showCatalogSections && (
          <>
            <p className="title-sm text-primary-light-low-contrast">
              Orgs personal attributes
            </p>
            <Banner kind="informative">{ORGS_PERSONAL_ATTRIBUTES_INFO}</Banner>
          </>
        )}
      </div>
    </Modal>
  );
}
