import type { Attribute } from "@knodia/attribute-models";

import { Banner, Modal } from "@knodia/ui-kit/ui";

import { ORGS_PERSONAL_ATTRIBUTES_INFO } from "@/utils/attributeCopy";
import { toSchemeRefKey } from "@/utils/schemeRef";

import { DefinitionCard } from "./DefinitionCard";

export function AttributesListModal({
  attributes,
  showOrgsPersonalAttributes = false,
}: {
  attributes: readonly Attribute[];
  showOrgsPersonalAttributes?: boolean;
}) {
  return (
    <Modal isDismissable title="Attributes list">
      <div className="flex flex-col gap-4">
        {showOrgsPersonalAttributes && (
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
        {showOrgsPersonalAttributes && (
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
