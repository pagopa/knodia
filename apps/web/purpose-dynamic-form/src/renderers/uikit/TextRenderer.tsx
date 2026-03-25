import { TextArea, TextField } from "@knodia/ui-kit/ui";

interface Props {
  description?: string | undefined;
  error?: string | undefined;
  isTextarea: boolean;
  label?: string | undefined;
  maxLength?: number | undefined;
  onChange: (value: string) => void;
  value: string;
}

export function TextRenderer({
  description,
  error,
  isTextarea,
  label,
  maxLength,
  onChange,
  value,
}: Props) {
  if (isTextarea) {
    return (
      <div className="flex flex-col gap-1">
        <TextArea
          description={description}
          errorMessage={error}
          isInvalid={!!error}
          label={label}
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

  return (
    <div className="flex flex-col gap-1">
      <TextField
        description={description}
        errorMessage={error}
        isInvalid={!!error}
        label={label}
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
