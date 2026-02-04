import { Children } from "react";
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger as AriaMenuTrigger,
  type MenuTriggerProps as AriaMenuTriggerProps,
  type MenuItemProps,
  type MenuProps,
  Popover,
  type PopoverProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";

import { dropdownStyles, listItemStyles } from "./styles";

interface MenuTriggerProps extends AriaMenuTriggerProps {
  placement?: PopoverProps["placement"];
}

export function Menu<T extends object>(props: MenuProps<T>) {
  return (
    <AriaMenu
      {...props}
      className={twMerge("empty:text-center empty:pb-2", dropdownStyles())}
    />
  );
}

export function MenuItem(props: MenuItemProps) {
  const textValue =
    props.textValue ||
    (typeof props.children === "string" ? props.children : "");
  return (
    <AriaMenuItem textValue={textValue} {...props} className={listItemStyles}>
      {props.children}
    </AriaMenuItem>
  );
}

export function MenuTrigger(props: MenuTriggerProps) {
  const [trigger, menu] = Children.toArray(props.children) as [
    React.ReactElement,
    React.ReactElement,
  ];
  return (
    <AriaMenuTrigger {...props}>
      {trigger}
      <Popover className="min-w-60" placement={props.placement ?? "bottom"}>
        {menu}
      </Popover>
    </AriaMenuTrigger>
  );
}
