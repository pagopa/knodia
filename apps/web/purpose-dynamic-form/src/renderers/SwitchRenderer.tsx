import { Checkbox, Label, Text } from "react-aria-components";

import type { ControlElement } from "../engine/types";

interface Props {
  control: ControlElement;
  error?: string | undefined;
  onChange: (value: string) => void;
  value: string;
}

export function SwitchRenderer({ control, error, onChange, value }: Props) {
  const isChecked = value === "true";
  const switchLabel =
    control.options?.optionLabels?.["true"] ?? control.label ?? "";

  return (
    <div className="flex flex-col gap-1">
      {control.label && (
        <span className="text-sm font-medium text-gray-900">
          {control.label}
        </span>
      )}
      {control.options?.infoLabel && (
        <span className="text-xs text-gray-500">
          {control.options.infoLabel}
        </span>
      )}
      <Checkbox
        className="group flex items-start gap-2 text-sm text-gray-700 cursor-pointer"
        isInvalid={!!error}
        isSelected={isChecked}
        onChange={(checked) => onChange(checked ? "true" : "false")}
      >
        <div className="size-4 shrink-0 mt-0.5 rounded border-2 border-gray-300 group-selected:border-blue-600 group-selected:bg-blue-600 flex items-center justify-center">
          <svg
            className="size-3 text-white opacity-0 group-selected:opacity-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 12 12"
          >
            <path d="M2 6l3 3 5-5" />
          </svg>
        </div>
        <Label>{switchLabel}</Label>
      </Checkbox>
      {control.options?.description && (
        <p className="pl-6 text-xs leading-relaxed text-gray-500">
          {control.options.description}
        </p>
      )}
      {error && <Text className="text-xs text-red-600">{error}</Text>}
    </div>
  );
}
