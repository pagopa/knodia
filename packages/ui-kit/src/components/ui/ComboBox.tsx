import { CaretDownIcon, XIcon } from "@phosphor-icons/react";
import {
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Button,
  composeRenderProps,
  Group,
  Input,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
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

const inputStyles = tv({
  base: "flex-1 min-w-0 body-md outline-none bg-transparent placeholder:text-primary-light-low-contrast",
});

export interface ComboBoxProps<T extends object> extends Omit<
  AriaComboBoxProps<T>,
  "children"
> {
  children: ((item: T) => React.ReactNode) | React.ReactNode;
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  isClearable?: boolean;
  items?: Iterable<T>;
  label?: string;
  placeholder?: string;
  size?: ComboBoxVariants["size"];
}

type ComboBoxVariants = VariantProps<typeof styles>;

export function ComboBox<T extends object>({
  label,
  description,
  errorMessage,
  children,
  size,
  isInvalid = false,
  isClearable = false,
  placeholder,
  ...props
}: ComboBoxProps<T>) {
  const hasValue =
    (props.inputValue != null && props.inputValue !== "" && props.inputValue) ||
    (props.selectedKey != null && props.selectedKey !== "");

  const handleClear = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.onInputChange?.("");
    props.onSelectionChange?.(null);
  };

  return (
    <AriaComboBox<T>
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "group flex flex-col gap-1 w-full min-w-0 relative font-sans",
      )}
      isInvalid={isInvalid}
    >
      {label && <Label>{label}</Label>}
      <Group
        className={styles({
          isInvalid,
          isFocused: false,
          size,
        })}
        data-slot="trigger"
      >
        <Input
          className={inputStyles()}
          placeholder={placeholder ?? "Search..."}
        />
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
          <Button className="outline-none">
            <CaretDownIcon
              aria-hidden
              className="w-5 h-5 text-primary-light-low-contrast"
            />
          </Button>
        )}
      </Group>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="min-w-[var(--trigger-width)] mt-2">
        <ListBox className={dropdownStyles}>{children}</ListBox>
      </Popover>
    </AriaComboBox>
  );
}

export function ComboBoxItem(props: ListBoxItemProps) {
  const textValue =
    props.textValue ||
    (typeof props.children === "string" ? props.children : "");

  return (
    <ListBoxItem {...props} className={listItemStyles} textValue={textValue}>
      {composeRenderProps(props.children, (children) => (
        <span className="min-w-0 flex-1 truncate">{children}</span>
      ))}
    </ListBoxItem>
  );
}
