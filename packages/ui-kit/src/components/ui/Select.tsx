import { CaretDownIcon, XIcon } from "@phosphor-icons/react";
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
  errorMessage?: ((validation: ValidationResult) => string) | string;
  isClearable?: boolean;
  items?: Iterable<T>;
  label?: string;
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
  items,
  size,
  isInvalid = false,
  isClearable = false,
  ...props
}: SelectProps<T, M>) {
  const hasValue = props.value != null && props.value !== "";

  const handleClear = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // @ts-expect-error - Clearing the select by passing null/empty value
    props.onChange?.(null);
  };

  return (
    <AriaSelect<T, M>
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "group flex flex-col gap-1 relative font-sans",
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
            isFocused: renderProps.isPressed,
          })
        }
      >
        <SelectValue className="flex-1 body-md truncate data-placeholder:text-primary-light-low-contrast">
          {({ selectedText, defaultChildren }) =>
            selectedText || defaultChildren
          }
        </SelectValue>
        {isClearable && hasValue ? (
          <span
            aria-label="Clear selection"
            className="w-5 h-5 text-primary-light-low-contrast hover:text-primary-light-high-contrast transition-colors cursor-pointer flex items-center justify-center"
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClear(e as unknown as React.MouseEvent);
              }
            }}
            onPointerDown={handleClear}
            role="button"
            tabIndex={0}
          >
            <XIcon aria-hidden className="w-5 h-5" />
          </span>
        ) : (
          <CaretDownIcon
            aria-hidden
            className="w-5 h-5 text-primary-light-low-contrast"
          />
        )}
      </Button>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="min-w-(--trigger-width)">
        <ListBox className={dropdownStyles} {...(items && { items })}>
          {children}
        </ListBox>
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
