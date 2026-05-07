import { CaretDownIcon } from "@phosphor-icons/react";
import {
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  Button,
  composeRenderProps,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  SelectValue,
  useLocale,
  type ValidationResult,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

import { composeTailwindRenderProps } from "../../libs/react-aria";
import { Description, FieldError, Label } from "./Field";
import { dropdownStyles, fieldInputStyle, listItemStyles } from "./styles";

const styles = tv({
  extend: fieldInputStyle,
  base: "flex items-center text-start gap-4 w-full text-primary-light-high-contrast",
  variants: {
    size: {
      sm: "py-1.25",
      md: "py-1.75",
      lg: "py-2.25",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface SelectProps<
  T extends Iterable<unknown> = Iterable<unknown>,
  M extends "multiple" | "single" = "single",
>
  extends Omit<AriaSelectProps<T, M>, "children">, SelectVariants {
  children: ((item: T) => React.ReactNode) | React.ReactNode;
  description?: string;
  endIcon?: React.ReactNode;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  label?: string;
  /**
   * How to join labels when 2+ items are selected. Forwarded to
   * `Intl.ListFormat`. Default `"conjunction"` (joined with "and", matching
   * React Aria's default). Use `"disjunction"` when selected items represent
   * alternatives (joined with "or").
   */
  selectionListFormatType?: "conjunction" | "disjunction";
}

interface DropdownItemProps extends ListBoxItemProps {
  endIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
}

type SelectVariants = VariantProps<typeof styles>;

export function Select<
  T extends Iterable<unknown> = Iterable<unknown>,
  M extends "multiple" | "single" = "single",
>({
  label,
  description,
  errorMessage,
  children,
  size,
  isInvalid = false,
  selectionListFormatType,
  ...props
}: SelectProps<T, M>) {
  const { locale } = useLocale();
  const isReadOnly = props.isReadOnly === true;

  return (
    <AriaSelect<T, M>
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "group flex flex-col gap-1 w-full min-w-0 relative font-sans",
      )}
      isInvalid={isInvalid}
    >
      {label && <Label>{label}</Label>}
      <Button
        className={(renderProps) =>
          styles({
            ...renderProps,
            size,
            isInvalid,
            isReadOnly,
            isDisabled: isReadOnly ? false : renderProps.isDisabled,
            isFocused: renderProps.isPressed,
          })
        }
        isDisabled={isReadOnly}
      >
        <SelectValue className="flex-1 min-w-0 body-md truncate data-placeholder:text-primary-light-low-contrast">
          {({ selectedText, defaultChildren, state }) => {
            if (
              selectionListFormatType === "disjunction" &&
              state.selectedItems.length > 1
            ) {
              return new Intl.ListFormat(locale, {
                type: "disjunction",
              }).format(state.selectedItems.map((item) => item.textValue));
            }
            return selectedText || defaultChildren;
          }}
        </SelectValue>
        <span className="text-primary-light-low-contrast [&>svg]:h-5 [&>svg]:w-5">
          {props.endIcon ?? <CaretDownIcon aria-hidden />}
        </span>
      </Button>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="min-w-(--trigger-width)">
        <ListBox className={dropdownStyles}>{children}</ListBox>
      </Popover>
    </AriaSelect>
  );
}
export function SelectItem({
  endIcon,
  startIcon,
  ...props
}: DropdownItemProps) {
  const textValue =
    props.textValue ||
    (typeof props.children === "string" ? props.children : "");

  return (
    <ListBoxItem {...props} className={listItemStyles} textValue={textValue}>
      {composeRenderProps(props.children, (children) => (
        <>
          {startIcon && <span aria-hidden="true">{startIcon}</span>}

          <span className="min-w-0 flex-1 truncate">{children}</span>

          {endIcon && (
            <span aria-hidden="true" className="ml-auto">
              {endIcon}
            </span>
          )}
        </>
      ))}
    </ListBoxItem>
  );
}
