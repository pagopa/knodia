import { Checkbox, CheckboxGroup, Tooltip } from "@knodia/ui-kit/ui";
import { Focusable, TooltipTrigger } from "react-aria-components";

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
      {options.map((opt) => {
        const checkbox = (
          <Checkbox key={opt.value} value={opt.value}>
            {opt.label}
          </Checkbox>
        );
        if (!isReadOnly) return checkbox;
        // In read-only mode, overlay a 16×16 transparent trigger on top of the
        // checkbox box so the tooltip anchors to the box itself (not the whole
        // row), which gives a centered arrow above the box.
        return (
          <div className="relative" key={opt.value}>
            {checkbox}
            <TooltipTrigger delay={0}>
              <Focusable>
                <span
                  className="absolute top-0 left-0 size-4 cursor-default"
                  tabIndex={0}
                />
              </Focusable>
              <Tooltip placement="top">Declared by Producer</Tooltip>
            </TooltipTrigger>
          </div>
        );
      })}
    </CheckboxGroup>
  );
}
