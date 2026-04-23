import type { ReactNode } from "react";

import { Modal } from "@knodia/ui-kit/ui";

export function ConsumerSuspendPurposeBody() {
  return (
    <p className="body-md">
      If you suspend it, you will no longer be able to use the associated
      E-Service for this Purpose. Are you sure you want to suspend this Purpose?
      <br />
      You will be able to reactivate it later.
    </p>
  );
}

export function ProducerSuspendPurposeBody() {
  return (
    <p className="body-md">
      If you suspend it, the Consumer won&apos;t be able to use the associated
      E-Service for this Purpose. Are you sure you want to suspend this Purpose?
      <br />
      You will be able to reactivate it later.
    </p>
  );
}

export function SuspendPurposeModal({
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
      title="Suspend Purpose"
    >
      {children}
    </Modal>
  );
}
