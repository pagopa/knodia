import { Radio, RadioGroup, TextField } from "@knodia/ui-kit/ui";

import { DeclaredByProducerTooltip } from "./DeclaredByProducerTooltip";

interface Props {
  description?: string | undefined;
  error?: string | undefined;
  isReadOnly?: boolean | undefined;
  label?: string | undefined;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}

export function RadioRenderer({
  description,
  error,
  isReadOnly,
  label,
  onChange,
  options,
  value,
}: Props) {
  if (isReadOnly) {
    const selectedLabel =
      options.find((opt) => opt.value === value)?.label ?? value;
    return (
      <TextField
        description={description}
        endIcon={<DeclaredByProducerTooltip />}
        isReadOnly
        label={label}
        onChange={onChange}
        value={selectedLabel}
      />
    );
  }

  return (
    <RadioGroup
      description={description}
      errorMessage={error}
      isInvalid={!!error}
      label={label}
      onChange={onChange}
      orientation="vertical"
      value={value}
    >
      {options.map((opt) => (
        <Radio key={opt.value} value={opt.value}>
          {opt.label}
        </Radio>
      ))}
    </RadioGroup>
  );
}
