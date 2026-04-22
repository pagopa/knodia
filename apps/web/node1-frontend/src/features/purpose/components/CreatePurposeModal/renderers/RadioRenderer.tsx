import { Radio, RadioGroup } from "@knodia/ui-kit/ui";

import type { ResolvedControl } from "@/features/purpose/engine/types";

interface Props {
  control: ResolvedControl;
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
      description={control.options?.description}
      errorMessage={error}
      isInvalid={!!error}
      label={control.label}
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
