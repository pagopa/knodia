import {
  ListBox as AriaListBox,
  type ListBoxProps as AriaListBoxProps,
} from "react-aria-components";

import { composeTailwindRenderProps } from "../../libs/react-aria";

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
