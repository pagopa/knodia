import { Checkbox, TextField } from "@knodia/ui-kit/ui";

import { DeclaredByProducerTooltip } from "./DeclaredByProducerTooltip";

interface Props {
  checkedLabel?: string | undefined;
  description?: string | undefined;
  error?: string | undefined;
  isReadOnly?: boolean | undefined;
  label?: string | undefined;
  onChange: (value: string) => void;
  value: string;
}

export function SwitchRenderer({
  checkedLabel,
  description,
  error,
  isReadOnly,
  label,
  onChange,
  value,
}: Props) {
  const isChecked = value === "true";

  if (isReadOnly) {
    return (
      <TextField
        description={description}
        endIcon={<DeclaredByProducerTooltip />}
        isReadOnly
        label={label}
        onChange={onChange}
        value={isChecked ? (checkedLabel ?? "Yes") : "No"}
      />
    );
  }

  const switchLabel = checkedLabel ?? label ?? "";

  return (
    <div className="flex flex-col">
      {label && (
        <span className="label-md text-primary-light-high-contrast">
          {label}
        </span>
      )}
      {description && (
        <span className="body-sm text-primary-light-mid-contrast first:mt-0 mt-3">
          {description}
        </span>
      )}
      <Checkbox
        className="first:mt-0 mt-3"
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
