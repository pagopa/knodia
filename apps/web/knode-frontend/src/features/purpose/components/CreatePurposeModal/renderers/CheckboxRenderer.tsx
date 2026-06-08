import { Checkbox, CheckboxGroup } from "@knodia/ui-kit/ui";

interface Props {
  description?: string | undefined;
  error?: string | undefined;
  isReadOnly?: boolean | undefined;
  label?: string | undefined;
  onChange: (value: string[]) => void;
  options: { label: string; value: string }[];
  value: string[];
}

export function CheckboxRenderer({
  description,
  error,
  isReadOnly,
  label,
  onChange,
  options,
  value,
}: Props) {
  return (
    <CheckboxGroup
      description={description}
      errorMessage={error}
      isInvalid={!!error}
      {...(isReadOnly && { isDisabled: true })}
      label={label}
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
