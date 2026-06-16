import { Radio, RadioGroup, Tooltip } from "@knodia/ui-kit/ui";
import { Focusable, TooltipTrigger } from "react-aria-components";

interface Props {
  description?: string | undefined;
  error?: string | undefined;
  isReadOnly?: boolean | undefined;
  label?: string | undefined;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}

export function RadioRenderer({
  description,
  error,
  isReadOnly,
  label,
  onChange,
  options,
  value,
}: Props) {
  return (
    <RadioGroup
      description={description}
      errorMessage={error}
      isInvalid={!!error}
      {...(isReadOnly && { isDisabled: true })}
      label={label}
      onChange={onChange}
      orientation="vertical"
      value={value}
    >
      {options.map((opt) => {
        const radio = (
          <Radio key={opt.value} value={opt.value}>
            {opt.label}
          </Radio>
        );
        if (!isReadOnly) return radio;
        return (
          <div className="relative" key={opt.value}>
            {radio}
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
    </RadioGroup>
  );
}
