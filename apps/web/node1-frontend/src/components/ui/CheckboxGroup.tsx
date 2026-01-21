import type { ReactNode } from "react";

import {
  CheckboxGroup as AriaCheckboxGroup,
  CheckboxGroupProps as AriaCheckboxGroupProps,
  ValidationResult,
} from "react-aria-components";

import { Description, FieldError, Label } from "@/components/ui/Field";
import { composeTailwindRenderProps } from "@/libs/react-aria";

export interface CheckboxGroupProps extends Omit<
  AriaCheckboxGroupProps,
  "children"
> {
  children?: ReactNode;
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  label?: string;
}

export function CheckboxGroup(props: CheckboxGroupProps) {
  return (
    <AriaCheckboxGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex flex-col gap-2 font-sans",
      )}
    >
      <Label>{props.label}</Label>
      {props.children}
      {props.description && <Description>{props.description}</Description>}
      <FieldError>{props.errorMessage}</FieldError>
    </AriaCheckboxGroup>
  );
}
