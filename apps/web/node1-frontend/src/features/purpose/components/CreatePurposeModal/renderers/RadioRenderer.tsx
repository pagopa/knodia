import { Radio, RadioGroup } from "@knodia/ui-kit/ui";

import type { ControlElement } from "../../engine/types";

interface Props {
  control: ControlElement;
  error?: string | undefined;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}

export function RadioRenderer({
  control,
  error,
  onChange,
  options,
  value,
}: Props) {
  return (
    <RadioGroup
      description={control.options?.infoLabel}
      errorMessage={error}
      isInvalid={!!error}
      label={control.label}
      onChange={onChange}
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
