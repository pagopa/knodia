import type { AriaToastProps, AriaToastRegionProps } from "@react-aria/toast";
import type { QueuedToast, ToastState } from "@react-stately/toast";

import { XIcon } from "@phosphor-icons/react";
import { useToast, useToastRegion } from "@react-aria/toast";
import { useToastQueue } from "@react-stately/toast";
import { useRef } from "react";
import { Button } from "react-aria-components";
import { tv } from "tailwind-variants";

import { type ToastContent, toastQueue } from "./toastQueue";

const toastStyle = tv({
  base: "flex w-[262px] items-center gap-2 rounded-lg px-4 py-3",
  variants: {
    kind: {
      neutral: "bg-secondary-dark",
      informative: "bg-info-dark",
      success: "bg-success-dark",
      warning: "bg-warning-dark",
      error: "bg-error-dark",
    },
  },
  defaultVariants: {
    kind: "neutral",
  },
});

export function ToastRegion(props: AriaToastRegionProps) {
  const state = useToastQueue(toastQueue);
  const ref = useRef<HTMLDivElement>(null);
  const { regionProps } = useToastRegion(props, state, ref);

  if (state.visibleToasts.length === 0) return null;

  return (
    <div
      ref={ref}
      {...regionProps}
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
    >
      {state.visibleToasts.map((toast) => (
        <ToastItem key={toast.key} state={state} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({
  state,
  toast,
}: AriaToastProps<ToastContent> & {
  state: ToastState<ToastContent>;
  toast: QueuedToast<ToastContent>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { closeButtonProps, titleProps, toastProps } = useToast(
    { toast },
    state,
    ref,
  );
  const { description, kind, title } = toast.content;

  return (
    <div ref={ref} {...toastProps} className={toastStyle({ kind })}>
      <div className="flex-1">
        <p {...titleProps} className="title-sm-em text-white">
          {title}
        </p>
        <p className="body-md text-white">{description}</p>
      </div>
      <Button
        aria-label={closeButtonProps["aria-label"]}
        className="shrink-0 cursor-pointer text-white hover:opacity-80"
        onPress={closeButtonProps.onPress}
      >
        <XIcon size={20} />
      </Button>
    </div>
  );
}
