import { Checkbox, Tooltip } from "@knodia/ui-kit/ui";
import { Focusable, TooltipTrigger } from "react-aria-components";

interface Props {
  checkedLabel?: string | undefined;
  description?: string | undefined;
  error?: string | undefined;
  isReadOnly?: boolean | undefined;
  label?: string | undefined;
  onChange: (value: string) => void;
  value: string;
}

export function SwitchRenderer({
  checkedLabel,
  description,
  error,
  isReadOnly,
  label,
  onChange,
  value,
}: Props) {
  const isChecked = value === "true";
  const switchLabel = checkedLabel ?? label ?? "";

  return (
    <div className="flex flex-col">
      {label && (
        <span className="label-md text-primary-light-high-contrast">
          {label}
        </span>
      )}
      {description && (
        <span className="body-sm text-primary-light-mid-contrast first:mt-0 mt-3">
          {description}
        </span>
      )}
      {isReadOnly ? (
        // Anchor the tooltip to the checkbox box (16×16) via a transparent
        // overlay so the arrow appears centered above it on hover.
        <div className="relative first:mt-0 mt-3">
          <Checkbox isDisabled isSelected={isChecked}>
            {switchLabel}
          </Checkbox>
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
      ) : (
        <Checkbox
          className="first:mt-0 mt-3"
          isInvalid={!!error}
          isSelected={isChecked}
          onChange={(checked) => onChange(checked ? "true" : "false")}
        >
          {switchLabel}
        </Checkbox>
      )}
      {error && (
        <span className="body-sm text-error-light-low-contrast mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
