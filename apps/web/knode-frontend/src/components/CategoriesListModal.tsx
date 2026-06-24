import {
  categories,
  type Category,
  getCategory,
} from "@knodia/category-models";
import { Modal } from "@knodia/ui-kit/ui";

import { DefinitionCard } from "./DefinitionCard";

const catalogCategories: Category[] = Object.entries(categories).flatMap(
  ([scheme, codes]) =>
    Object.keys(codes)
      .map((code) => getCategory(scheme, code))
      .filter((category): category is Category => category !== undefined),
);

interface CategoriesListModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CategoriesListModal({
  isOpen,
  onOpenChange,
}: CategoriesListModalProps) {
  return (
    <Modal
      isDismissable
      isOpen={isOpen}
      onDismiss={() => onOpenChange(false)}
      onOpenChange={onOpenChange}
      title="Categories list"
    >
      <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
        {catalogCategories.map((category) => (
          <DefinitionCard
            description={category.description}
            key={`${category.scheme}$${category.code}`}
            name={category.name}
          />
        ))}
      </div>
    </Modal>
  );
}
