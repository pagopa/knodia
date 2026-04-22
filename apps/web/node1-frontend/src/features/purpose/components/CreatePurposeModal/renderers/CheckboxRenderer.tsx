import { Checkbox, CheckboxGroup } from "@knodia/ui-kit/ui";

import type { ResolvedControl } from "@/features/purpose/engine/types";

interface Props {
  control: ResolvedControl;
  error?: string | undefined;
  onChange: (value: string[]) => void;
  options: { label: string; value: string }[];
  value: string[];
}

export function CheckboxRenderer({
  control,
  error,
  onChange,
  options,
  value,
}: Props) {
  return (
    <CheckboxGroup
      description={control.options?.description}
      errorMessage={error}
      isInvalid={!!error}
      label={control.label}
      onChange={onChange}
      value={value}
    >
      {options.map((opt) => (
        <Checkbox key={opt.value} value={opt.value}>
          {opt.label}
        </Checkbox>
      ))}
    </CheckboxGroup>
  );
}
