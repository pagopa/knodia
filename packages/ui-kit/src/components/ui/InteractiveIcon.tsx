import { composeRenderProps } from "react-aria-components";
import { twMerge } from "tailwind-merge";

import { ButtonIcon, type ButtonIconProps } from "./ButtonIcon";

type InteractiveIconProps = Omit<ButtonIconProps, "kind" | "size">;

export function InteractiveIcon({
  children,
  hierarchy = "neutral",
  ...props
}: InteractiveIconProps) {
  return (
    <ButtonIcon
      {...props}
      className={composeRenderProps(props.className, (className) =>
        twMerge("rounded-full", className),
      )}
      hierarchy={hierarchy}
      kind="ghost"
      size="sm"
    >
      {children}
    </ButtonIcon>
  );
}
