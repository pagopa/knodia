import { Radio, RadioGroup } from "@knodia/ui-kit/ui";

interface Props {
  description?: string | undefined;
  error?: string | undefined;
  label?: string | undefined;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}

export function RadioRenderer({
  description,
  error,
  label,
  onChange,
  options,
  value,
}: Props) {
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
