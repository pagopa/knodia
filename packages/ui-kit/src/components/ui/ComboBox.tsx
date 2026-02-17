import { CaretDownIcon, XIcon } from "@phosphor-icons/react";
import { useLayoutEffect, useRef, useState } from "react";
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
import { dropdownStyles, fieldGroupStyles, listItemStyles } from "./styles";

const sizeStyles = tv({
  base: "px-3",
  variants: {
    size: {
      sm: "h-8",
      md: "h-10",
      lg: "h-12",
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

type ComboBoxVariants = VariantProps<typeof sizeStyles>;

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
  const groupRef = useRef<HTMLDivElement>(null);
  const [popoverWidth, setPopoverWidth] = useState<number | undefined>();

  // Popover width fix: React Aria's --trigger-width CSS variable doesn't correctly
  // reflect the Group width when using Group as the trigger. We manually measure
  // the Group with ResizeObserver and apply it as an inline style to the Popover.
  useLayoutEffect(() => {
    if (!groupRef.current) return;

    const updateWidth = () => {
      if (groupRef.current) {
        setPopoverWidth(groupRef.current.offsetWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(groupRef.current);

    return () => observer.disconnect();
  }, []);

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
        className={composeRenderProps(
          sizeStyles({ size }),
          (className, renderProps) =>
            fieldGroupStyles({
              ...renderProps,
              isInvalid,
              className,
            }),
        )}
        ref={groupRef}
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
      <Popover
        className="mt-2"
        offset={0}
        style={{ width: popoverWidth }}
        triggerRef={groupRef}
      >
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
