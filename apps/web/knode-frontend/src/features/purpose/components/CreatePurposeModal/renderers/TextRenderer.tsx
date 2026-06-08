import { TextArea, TextField } from "@knodia/ui-kit/ui";

interface Props {
  description?: string | undefined;
  error?: string | undefined;
  isReadOnly?: boolean | undefined;
  label?: string | undefined;
  maxLength?: number | undefined;
  onChange: (value: string) => void;
  value: string;
  widget: "text" | "textarea";
}

export function TextRenderer({
  description,
  error,
  isReadOnly,
  label,
  maxLength,
  onChange,
  value,
  widget,
}: Props) {
  const Component = widget === "textarea" ? TextArea : TextField;

  return (
    <div className="flex flex-col gap-1">
      <Component
        description={description}
        errorMessage={error}
        isInvalid={!!error}
        {...(isReadOnly && { isReadOnly: true })}
        label={label}
        onChange={onChange}
        value={value}
        {...(maxLength !== undefined && { maxLength })}
      />
      {maxLength != null && !isReadOnly && (
        <span className="text-xs text-primary-light-low-contrast self-end">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}
