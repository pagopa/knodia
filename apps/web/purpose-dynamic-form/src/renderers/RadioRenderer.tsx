import { Label, Radio, RadioGroup, Text } from "react-aria-components";

import type { ControlElement } from "../engine/types";

interface Props {
  control: ControlElement;
  error?: string | undefined;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}

export function RadioRenderer({
  control,
  error,
  onChange,
  options,
  value,
}: Props) {
  return (
    <RadioGroup
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
      <div
        className={
          control.options?.layout === "horizontal"
            ? "flex gap-10 py-1"
            : "flex flex-col gap-1"
        }
      >
        {options.map((opt) => (
          <Radio
            className="group flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            key={opt.value}
            value={opt.value}
          >
            <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-selected:border-blue-600">
              <div className="hidden size-2 rounded-full bg-blue-600 group-selected:block" />
            </div>
            {opt.label}
          </Radio>
        ))}
      </div>
      {error && (
        <Text className="text-xs text-red-600" slot="errorMessage">
          {error}
        </Text>
      )}
    </RadioGroup>
  );
}
