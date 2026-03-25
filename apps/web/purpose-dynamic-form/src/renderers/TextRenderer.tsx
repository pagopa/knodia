import { Input, Label, Text, TextArea, TextField } from "react-aria-components";

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
  return (
    <TextField
      isInvalid={!!error}
      onChange={onChange}
      value={value}
      {...(maxLength !== undefined && { maxLength })}
      className="flex flex-col gap-1"
    >
      <Label className="text-sm font-medium text-gray-900">{label}</Label>
      {description && (
        <Text className="text-xs text-gray-500" slot="description">
          {description}
        </Text>
      )}
      {isTextarea ? (
        <TextArea className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-24 resize-y" />
      ) : (
        <Input className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      )}
      <div className="flex justify-between">
        {error ? (
          <Text className="text-xs text-red-600" slot="errorMessage">
            {error}
          </Text>
        ) : (
          <span />
        )}
        {maxLength != null && (
          <span className="text-xs text-gray-500">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </TextField>
  );
}
