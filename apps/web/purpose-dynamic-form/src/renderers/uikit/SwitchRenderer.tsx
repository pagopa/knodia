import { Checkbox } from "@knodia/ui-kit/ui";

import type { ControlElement } from "../../engine/types";

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

  return (
    <div className="flex flex-col gap-1">
      {control.label && (
        <span className="label-md text-primary-light-high-contrast">
          {control.label}
        </span>
      )}
      {control.options?.infoLabel && (
        <span className="body-sm text-primary-light-mid-contrast">
          {control.options.infoLabel}
        </span>
      )}
      <Checkbox
        description={control.options?.description}
        isInvalid={!!error}
        isSelected={isChecked}
        onChange={(checked) => onChange(checked ? "true" : "false")}
      >
        {switchLabel}
      </Checkbox>
      {error && (
        <span className="body-sm text-error-light-low-contrast">{error}</span>
      )}
    </div>
  );
}
