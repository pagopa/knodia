import {
  composeRenderProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { SecurityIcon } from "@/components/icons";
import { focusRing } from "@/components/ui/styles";

const actionItemStyles = tv({
  base: "group flex h-[79px] w-full cursor-pointer items-center gap-4 rounded-feature",
  extend: focusRing,
});

interface GdprActionItemProps extends RACButtonProps {
  label: string;
}

export function GdprActionItem({ label, ...props }: GdprActionItemProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        actionItemStyles({ ...renderProps, className }),
      )}
    >
      <span className="flex size-16 shrink-0 items-center justify-center rounded-feature bg-primary-light-violet">
        <SecurityIcon className="size-6 text-primary-violet" />
      </span>
      <span className="text-style-action text-primary-violet">{label}</span>
    </RACButton>
  );
}
