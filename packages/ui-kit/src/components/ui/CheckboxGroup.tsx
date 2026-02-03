import {
  CheckboxGroup as AriaCheckboxGroup,
  type CheckboxGroupProps as AriaCheckboxGroupProps,
  type ValidationResult,
} from "react-aria-components";

import { composeTailwindRenderProps } from "../../libs/react-aria";
import { Description, FieldError, Label } from "./Field";

interface CheckboxGroupProps extends Omit<AriaCheckboxGroupProps, "children"> {
  children?: React.ReactNode;
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  label?: string;
  orientation?: "horizontal" | "vertical";
}

export function CheckboxGroup({
  orientation = "vertical",
  ...props
}: CheckboxGroupProps) {
  return (
    <AriaCheckboxGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex flex-col gap-3 group font-sans",
      )}
      data-orientation={orientation}
    >
      <Label>{props.label}</Label>
      <div className="flex group-orientation-vertical:flex-col gap-4">
        {props.children}
      </div>
      {props.description && <Description>{props.description}</Description>}
      <FieldError>{props.errorMessage}</FieldError>
    </AriaCheckboxGroup>
  );
}
