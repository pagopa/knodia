import { Select, SelectItem } from "@knodia/ui-kit/ui";

import type { ControlElement } from "@/features/purpose/engine/types";

interface Props {
  control: ControlElement;
  error?: string | undefined;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}

export function SelectRenderer({
  control,
  error,
  onChange,
  options,
  value,
}: Props) {
  return (
    <Select
      description={control.options?.description}
      errorMessage={error}
      isInvalid={!!error}
      label={control.label}
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
