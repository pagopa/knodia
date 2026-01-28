import {
  ListBox as AriaListBox,
  type ListBoxProps as AriaListBoxProps,
  composeRenderProps,
  ListBoxItem,
  type ListBoxItemProps,
} from "react-aria-components";

import { composeTailwindRenderProps } from "../../libs/react-aria";
import { ListItem } from "./ListItem";

export interface DropdownItemProps extends ListBoxItemProps {
  endIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
}

type DropdownProps<T> = Omit<AriaListBoxProps<T>, "layout" | "orientation">;

export function Dropdown<T extends object>({
  children,
  ...props
}: DropdownProps<T>) {
  return (
    <AriaListBox
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "outline-0 p-2 bg-white border border-primary-light-decorative rounded-2xl shadow-dropdown flex flex-col gap-1 outline-hidden box-border max-h-[inherit] overflow-auto",
      )}
    >
      {children}
    </AriaListBox>
  );
}

export function DropdownItem({
  startIcon,
  endIcon,
  ...props
}: DropdownItemProps) {
  const textValue =
    props.textValue ||
    (typeof props.children === "string" ? props.children : "");
  return (
    <ListBoxItem {...props} textValue={textValue}>
      {composeRenderProps(props.children, (children, renderProps) => (
        <ListItem {...renderProps} endIcon={endIcon} startIcon={startIcon}>
          {children}
        </ListItem>
      ))}
    </ListBoxItem>
  );
}
