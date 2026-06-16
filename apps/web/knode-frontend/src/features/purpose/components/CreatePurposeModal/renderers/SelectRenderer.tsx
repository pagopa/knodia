import { Select, SelectItem, TextField } from "@knodia/ui-kit/ui";

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

export function SelectRenderer({
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
    <Select
      description={description}
      errorMessage={error}
      isInvalid={!!error}
      label={label}
      onSelectionChange={(key) => onChange(key as string)}
      selectedKey={value}
    >
      {options.map((opt) => (
        <SelectItem id={opt.value} key={opt.value}>
          {opt.label}
        </SelectItem>
      ))}
    </Select>
  );
}
