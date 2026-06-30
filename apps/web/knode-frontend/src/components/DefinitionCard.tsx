import { BookOpenTextIcon } from "@phosphor-icons/react";

interface DefinitionCardProps {
  description: string;
  name: string;
}

export function DefinitionCard({ description, name }: DefinitionCardProps) {
  return (
    <div className="bg-secondary-light flex w-full flex-col gap-3 rounded-definition-card p-6">
      <div className="flex items-center gap-2">
        <BookOpenTextIcon
          aria-hidden
          className="shrink-0 text-secondary-light-high-contrast"
          size={20}
        />
        <span className="label-lg text-secondary-light-high-contrast">
          {name}
        </span>
      </div>
      <p className="body-lg text-secondary-light-mid-contrast">{description}</p>
    </div>
  );
}
