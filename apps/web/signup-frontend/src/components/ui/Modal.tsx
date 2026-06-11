import {
  Dialog as AriaDialog,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type ModalOverlayProps as AriaModalOverlayProps,
  composeRenderProps,
  Heading,
  type PressEvent,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { Button } from "./Button";

const overlayStyles = tv({
  base: "fixed top-0 left-0 isolate z-50 flex h-(--visual-viewport-height) w-full items-center justify-center bg-neutral-medium-gray/80 p-4",
});

const modalStyles = tv({
  base: "flex max-h-full w-[688px] flex-col gap-8 rounded-modal bg-neutral-white p-8",
});

interface ModalProps extends AriaModalOverlayProps {
  actionLabel: string;
  cancelLabel?: string;
  children?: React.ReactNode;
  description?: string;
  isActionDisabled?: boolean;
  onCancel?: (e: PressEvent) => void;
  onConfirm?: (e: PressEvent) => void;
  title: string;
}

/** @knipignore — scaffolded in KN-739, wired up by the next signup screens */
export function Modal({
  actionLabel,
  cancelLabel = "Cancel",
  children,
  description,
  isActionDisabled = false,
  onCancel,
  onConfirm,
  title,
  ...props
}: ModalProps) {
  return (
    <AriaModalOverlay
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        overlayStyles({ ...renderProps, className }),
      )}
    >
      <AriaModal className={(renderProps) => modalStyles({ ...renderProps })}>
        <AriaDialog className="flex w-full flex-col gap-8 outline-none">
          <div className="flex flex-col gap-2">
            <Heading
              className="text-style-subheading text-neutral-graphite"
              slot="title"
            >
              {title}
            </Heading>
            {description && (
              <p className="text-style-body text-neutral-medium-gray">
                {description}
              </p>
            )}
          </div>
          {children}
          <div className="flex items-center justify-end gap-6">
            <Button
              slot="close"
              variant="secondary"
              {...(onCancel && { onPress: onCancel })}
            >
              {cancelLabel}
            </Button>
            <Button
              isDisabled={isActionDisabled}
              variant="primary"
              {...(onConfirm && { onPress: onConfirm })}
            >
              {actionLabel}
            </Button>
          </div>
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}
