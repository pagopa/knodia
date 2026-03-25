import { Checkbox } from "@knodia/ui-kit/ui";

interface Props {
  description?: string | undefined;
  error?: string | undefined;
  label?: string | undefined;
  onChange: (value: string) => void;
  switchLabel: string;
  value: string;
}

export function SwitchRenderer({
  description,
  error,
  label,
  onChange,
  switchLabel,
  value,
}: Props) {
  const isChecked = value === "true";

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="label-md text-primary-light-high-contrast">
          {label}
        </span>
      )}
      <Checkbox
        description={description}
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
