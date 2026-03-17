import { Input, Label, Text, TextArea, TextField } from "react-aria-components";

import type { ControlElement } from "../engine/types";

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
  const isTextarea = control.options?.widget === "textarea";

  return (
    <TextField
      isInvalid={!!error}
      onChange={onChange}
      value={value}
      {...(maxLength !== undefined && { maxLength })}
      className="flex flex-col gap-1"
    >
      <Label className="text-sm font-medium text-gray-900">
        {control.label}
      </Label>
      {control.options?.infoLabel && (
        <Text className="text-xs text-gray-500" slot="description">
          {control.options.infoLabel}
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
