import { Button } from "@knodia/ui-kit/ui";
import { FileTextIcon, TrashIcon } from "@phosphor-icons/react";

interface Props {
  name: string;
  onRemove: () => void;
}

export const RemovableDocumentRecap = ({ name, onRemove }: Props) => (
  <div className="bg-primary-light border-slate-100 border py-3 px-4 rounded-2xl flex justify-between elevation-1">
    <div className="flex gap-4 items-center">
      <FileTextIcon className="text-brand-dark" size={24} />
      <span className="body-lg-em text-primary-light-high-contrast">
        {name}
      </span>
    </div>

    <Button
      aria-label={`Delete ${name} file`}
      hierarchy="danger"
      kind="tonal"
      onPress={onRemove}
      size="icon-md"
    >
      <TrashIcon />
    </Button>
  </div>
);
