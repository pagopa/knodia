import { Navbar } from "@knodia/ui-kit/layout";
import { Button } from "@knodia/ui-kit/ui";
import { XIcon } from "@phosphor-icons/react";
import { type ReactNode, useId } from "react";
import {
  Dialog as AriaDialog,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from "react-aria-components";

interface Props {
  children: ReactNode;
  onClose: () => void;
  title: string;
}

export function FullPageModal({ children, onClose, title }: Props) {
  const titleId = useId();

  return (
    <AriaModalOverlay
      className="fixed inset-0 z-50"
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <AriaModal className="fixed inset-0 bg-white">
        <AriaDialog
          aria-labelledby={titleId}
          className="flex h-full flex-col outline-none"
        >
          <Navbar className="bg-brand-light">
            <h1
              className="text-brand-light-high-contrast headline-sm"
              id={titleId}
            >
              {title}
            </h1>
            <Button
              // Synchronous focus target so containment holds on first open, before the Suspense-loaded form mounts.
              aria-label="Close modal"
              autoFocus
              hierarchy="neutral"
              kind="ghost"
              onPress={onClose}
              size="icon-md"
            >
              <XIcon />
            </Button>
          </Navbar>
          <div className="flex-1 overflow-auto">{children}</div>
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}
