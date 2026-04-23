import type { ReactNode } from "react";

import { Modal } from "@knodia/ui-kit/ui";

export function ConsumerSuspendAgreementBody() {
  return (
    <p className="body-md">
      If you suspend it, the Producer won&apos;t be able to reactivate the
      Agreement on your behalf. Are you sure you want to suspend this Agreement?
      <br />
      You will be able to reactivate it later.
    </p>
  );
}

export function ProducerSuspendAgreementBody() {
  return (
    <p className="body-md">
      If you suspend it, the Consumer won&apos;t be able to use the associated
      E-Service or reactivate the Agreement. Are you sure you want to suspend
      this Agreement?
      <br />
      You will be able to reactivate it later.
    </p>
  );
}

export function SuspendAgreementModal({
  children,
  isError,
  isOpen,
  isPending,
  onConfirm,
  onOpenChange,
}: {
  children: ReactNode;
  isError: boolean;
  isOpen: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (isOpen: boolean) => void;
}) {
  return (
    <Modal
      actionLabel="Suspend anyway"
      cancelLabel="Cancel"
      confirmButtonProps={{ isPending }}
      isDismissable
      isOpen={isOpen}
      kind="destructive"
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      showErrorBanner={isError}
      title="Suspend Agreement"
    >
      {children}
    </Modal>
  );
}
