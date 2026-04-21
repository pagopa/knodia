import { Checkbox } from "@knodia/ui-kit/ui";

import type { ControlElement } from "@/features/purpose/engine/types";

interface Props {
  control: ControlElement;
  error?: string | undefined;
  onChange: (value: string) => void;
  value: string;
}

export function SwitchRenderer({ control, error, onChange, value }: Props) {
  const isChecked = value === "true";
  const switchLabel =
    control.options?.optionLabels?.["true"] ?? control.label ?? "";
  const hasLeadingText = Boolean(control.label ?? control.options?.description);

  return (
    <div className="flex flex-col">
      {control.label && (
        <span className="label-md text-primary-light-high-contrast">
          {control.label}
        </span>
      )}
      {control.options?.description && (
        <span className="body-sm text-primary-light-mid-contrast mt-3">
          {control.options.description}
        </span>
      )}
      <Checkbox
        className={hasLeadingText ? "mt-3" : undefined}
        isInvalid={!!error}
        isSelected={isChecked}
        onChange={(checked) => onChange(checked ? "true" : "false")}
      >
        {switchLabel}
      </Checkbox>
      {error && (
        <span className="body-sm text-error-light-low-contrast mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
