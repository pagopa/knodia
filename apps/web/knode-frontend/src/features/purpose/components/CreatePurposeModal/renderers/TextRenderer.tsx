import { TextArea, TextField } from "@knodia/ui-kit/ui";

import type { ControlElement } from "@/features/purpose/engine/types";

interface Props {
  control: ControlElement;
  error?: string | undefined;
  maxLength?: number | undefined;
  onChange: (value: string) => void;
  value: string;
}

export function TextRenderer({
  control,
  error,
  maxLength,
  onChange,
  value,
}: Props) {
  const Component =
    control.options?.widget === "textarea" ? TextArea : TextField;

  return (
    <div className="flex flex-col gap-1">
      <Component
        description={control.options?.infoLabel}
        errorMessage={error}
        isInvalid={!!error}
        label={control.label}
        onChange={onChange}
        value={value}
        {...(maxLength !== undefined && { maxLength })}
      />
      {maxLength != null && (
        <span className="text-xs text-primary-light-low-contrast self-end">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}
