import { listCategories } from "@knodia/category-models";
import { Modal } from "@knodia/ui-kit/ui";

import { toSchemeRefKey } from "@/utils/schemeRef";

import { DefinitionCard } from "./DefinitionCard";
import { ModalScrollArea } from "./ModalScrollArea";

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
      onOpenChange={onOpenChange}
      title="Categories list"
    >
      <ModalScrollArea className="gap-2">
        {listCategories().map((category) => (
          <DefinitionCard
            description={category.description}
            key={toSchemeRefKey(category)}
            name={category.name}
          />
        ))}
      </ModalScrollArea>
    </Modal>
  );
}
