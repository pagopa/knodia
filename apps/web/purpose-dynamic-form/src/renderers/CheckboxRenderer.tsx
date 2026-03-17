import { Checkbox, CheckboxGroup, Label, Text } from "react-aria-components";

import type { ControlElement } from "../engine/types";

interface Props {
  control: ControlElement;
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
      className="flex flex-col gap-2"
      isInvalid={!!error}
      onChange={onChange}
      value={value}
    >
      <Label className="text-sm font-medium text-gray-900">
        {control.label}
      </Label>
      {control.options?.infoLabel && (
        <Text className="text-xs text-gray-500" slot="description">
          {control.options.infoLabel}
        </Text>
      )}
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <Checkbox
            className="group flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            key={opt.value}
            value={opt.value}
          >
            <div className="size-4 rounded border-2 border-gray-300 group-data-selected:border-blue-600 group-data-selected:bg-blue-600 flex items-center justify-center">
              <svg
                className="size-3 text-white opacity-0 group-data-selected:opacity-100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 12 12"
              >
                <path d="M2 6l3 3 5-5" />
              </svg>
            </div>
            {opt.label}
          </Checkbox>
        ))}
      </div>
      {error && (
        <Text className="text-xs text-red-600" slot="errorMessage">
          {error}
        </Text>
      )}
    </CheckboxGroup>
  );
}
