import { listCategories } from "@knodia/category-models";
import { Modal } from "@knodia/ui-kit/ui";

import { toSchemeRefKey } from "@/utils/schemeRef";

import { DefinitionCard } from "./DefinitionCard";

export function CategoriesListModal() {
  return (
    <Modal isDismissable title="Categories list">
      <div className="flex flex-col gap-2">
        {listCategories().map((category) => (
          <DefinitionCard
            description={category.description}
            key={toSchemeRefKey(category.id)}
            name={category.name}
          />
        ))}
      </div>
    </Modal>
  );
}
