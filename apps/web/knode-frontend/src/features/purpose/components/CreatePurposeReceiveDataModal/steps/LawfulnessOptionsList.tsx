import type { bffApi } from "@knodia/bff-client";

interface Props {
  canSubmit: boolean;
  onSelect: (optionId: string) => void;
  options: bffApi.ConsumerPurposeFormOption[];
}

export function LawfulnessOptionsList({ canSubmit, onSelect, options }: Props) {
  if (options.length === 0) {
    return (
      <p className="body-md text-primary-light-low-contrast">
        No Lawfulness of processing has been published for this E-Service.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {options.map((option) => (
        <button
          className="border-primary-light-low-contrast hover:border-primary-light-high-contrast flex items-center justify-between gap-4 rounded-md border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSubmit}
          key={option.id}
          onClick={() => onSelect(option.id)}
          type="button"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="body-lg-bold truncate">
              Lawfulness of {option.name.en}
            </span>
            <span className="body-md text-primary-light-low-contrast truncate">
              {option.description.en}
            </span>
          </div>
          <span aria-hidden className="body-lg-bold">
            →
          </span>
        </button>
      ))}
    </div>
  );
}
