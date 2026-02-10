import { XIcon } from "@phosphor-icons/react";
import { useId } from "react";
import {
  Dialog as AriaDialog,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type ModalOverlayProps as AriaModalOverlayProps,
  composeRenderProps,
  type PressEvent,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { Button } from "./Button";
import { Checkbox } from "./Checkbox";

const overlay = tv({
  base: "fixed left-0 top-0 isolate z-50 flex h-(--visual-viewport-height) w-full items-center justify-center bg-black/50 p-4",
  variants: {
    isEntering: {
      true: "animate-in fade-in duration-200 ease-out",
    },
    isExiting: {
      true: "animate-out fade-out duration-200 ease-in",
    },
  },
});

const modal = tv({
  base: "max-h-full w-xl overflow-hidden rounded-2xl bg-white elevation-5 p-6",
  variants: {
    isEntering: {
      true: "animate-in zoom-in-95 duration-200 ease-out",
    },
    isExiting: {
      true: "animate-out zoom-out-95 duration-200 ease-in",
    },
  },
});

interface ModalProps extends AriaModalOverlayProps {
  actionLabel: string;
  cancelLabel?: string;
  children?: React.ReactNode;
  description?: string;
  kind: "default" | "destructive";
  onClose?: (e: PressEvent) => void;
  onConfirm?: (e: PressEvent) => void;
  onDismiss?: () => void;
  onDontShowAgainChange?: (isSelected: boolean) => void;
  showDontShowAgain?: boolean;
  title: string;
}

export function Modal({
  actionLabel,
  cancelLabel = "Cancel",
  children,
  className,
  description,
  kind,
  onClose,
  onConfirm,
  onDismiss,
  onDontShowAgainChange,
  showDontShowAgain = false,
  title,
  ...props
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <AriaModalOverlay
      {...props}
      className={composeRenderProps(className, (className, renderProps) =>
        overlay({ ...renderProps, className }),
      )}
      onOpenChange={(isOpen) => {
        if (!isOpen) onDismiss?.();
      }}
    >
      <AriaModal className={(renderProps) => modal({ ...renderProps })}>
        <AriaDialog
          aria-labelledby={titleId}
          className="w-full outline-none flex flex-col gap-6"
          {...(description && { "aria-describedby": descriptionId })}
        >
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start gap-6">
              <p className="title-md-em" id={titleId}>
                {title}
              </p>
              {onDismiss && (
                <Button
                  className="p-0"
                  hierarchy="neutral"
                  kind="ghost"
                  onPress={onDismiss}
                  size="icon-sm"
                >
                  <XIcon />
                </Button>
              )}
            </div>
            {description && (
              <span className=" body-md" id={descriptionId}>
                {description}
              </span>
            )}
          </div>

          {children}

          <div className="flex justify-between gap-6 items-center">
            {showDontShowAgain ? (
              <Checkbox
                {...(onDontShowAgainChange && {
                  onChange: onDontShowAgainChange,
                })}
              >
                Don&apos;t show this again
              </Checkbox>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <Button
                autoFocus
                hierarchy="neutral"
                kind="tonal"
                size="md"
                {...(onClose && { onPress: onClose })}
              >
                {cancelLabel}
              </Button>
              <Button
                hierarchy={kind === "destructive" ? "danger" : "brand"}
                size="md"
                {...(onConfirm && { onPress: onConfirm })}
              >
                {actionLabel}
              </Button>
            </div>
          </div>
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}
