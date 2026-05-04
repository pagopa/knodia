import { Select, SelectItem } from "@knodia/ui-kit/ui";

interface Props {
  description?: string | undefined;
  error?: string | undefined;
  label?: string | undefined;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}

export function SelectRenderer({
  description,
  error,
  label,
  onChange,
  options,
  value,
}: Props) {
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
