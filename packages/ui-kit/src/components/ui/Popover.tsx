import { XIcon } from "@phosphor-icons/react";
import { useId } from "react";
import {
  Dialog as AriaDialog,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
  composeRenderProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { Button } from "./Button";

const popover = tv({
  base: "rounded-popover bg-white elevation-1 border border-neutral-100 p-4",
  variants: {
    isEntering: {
      true: "animate-in fade-in placement-bottom:slide-in-from-top-1 placement-top:slide-in-from-bottom-1 duration-200 ease-out",
    },
    isExiting: {
      true: "animate-out fade-out placement-bottom:slide-out-to-top-1 placement-top:slide-out-to-bottom-1 duration-200 ease-in",
    },
  },
});

interface PopoverProps extends Omit<AriaPopoverProps, "children" | "style"> {
  children: React.ReactNode;
  title: string;
}

export function Popover({
  children,
  className,
  title,
  ...props
}: PopoverProps) {
  const titleId = useId();

  return (
    <AriaPopover
      {...props}
      className={composeRenderProps(className, (className, renderProps) =>
        popover({ ...renderProps, className }),
      )}
    >
      <AriaDialog aria-labelledby={titleId} className="outline-none">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-start gap-4">
            <p className="title-sm-em" id={titleId}>
              {title}
            </p>
            <Button
              aria-label="Close"
              className="p-0"
              hierarchy="neutral"
              kind="ghost"
              size="icon-sm"
              slot="close"
            >
              <XIcon />
            </Button>
          </div>
          {children}
        </div>
      </AriaDialog>
    </AriaPopover>
  );
}
