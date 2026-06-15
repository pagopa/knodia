import {
  composeRenderProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import type { IconProps } from "@/components/icons/MaterialSymbolIcon";

import { focusRing } from "@/components/ui/styles";

const actionItemStyles = tv({
  base: "group flex h-[79px] w-full cursor-pointer items-center gap-4 rounded-feature",
  extend: focusRing,
});

interface GdprActionItemProps extends RACButtonProps {
  icon: React.ComponentType<IconProps>;
  label: string;
}

export function GdprActionItem({
  icon: Icon,
  label,
  ...props
}: GdprActionItemProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        actionItemStyles({ ...renderProps, className }),
      )}
    >
      <span className="flex size-16 shrink-0 items-center justify-center rounded-feature bg-primary-light-violet">
        <Icon className="size-6 text-primary-violet" />
      </span>
      <span className="font-body text-[18px] leading-[26px] font-bold text-primary-violet">
        {label}
      </span>
    </RACButton>
  );
}
