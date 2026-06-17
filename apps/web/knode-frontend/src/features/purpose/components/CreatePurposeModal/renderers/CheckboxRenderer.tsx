import { Checkbox, CheckboxGroup, TextArea } from "@knodia/ui-kit/ui";

import { DeclaredByProducerTooltip } from "./DeclaredByProducerTooltip";

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
  if (isReadOnly) {
    const selectedLabels = value
      .map((v) => options.find((opt) => opt.value === v)?.label ?? v)
      .join("; ");
    return (
      <div className="relative">
        <TextArea
          className="[&_textarea]:pr-12"
          description={description}
          isReadOnly
          label={label}
          onChange={() => undefined}
          value={selectedLabels}
        />
        <span className="text-primary-light-low-contrast pointer-events-auto absolute top-1/2 right-3 -translate-y-1/2 [&>svg]:h-5 [&>svg]:w-5">
          <DeclaredByProducerTooltip />
        </span>
      </div>
    );
  }

  return (
    <CheckboxGroup
      description={description}
      errorMessage={error}
      isInvalid={!!error}
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
