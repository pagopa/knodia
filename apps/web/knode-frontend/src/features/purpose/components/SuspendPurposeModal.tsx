import { Modal } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

export function SuspendPurposeModal({
  isError,
  isOpen,
  isPending,
  onConfirm,
  onOpenChange,
  suspendActor,
}: {
  isError: boolean;
  isOpen: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (isOpen: boolean) => void;
  suspendActor: "consumer" | "producer";
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
      {match(suspendActor)
        .with("consumer", () => <SuspendPurposeByConsumerBody />)
        .with("producer", () => <SuspendPurposeByProducerBody />)
        .exhaustive()}
    </Modal>
  );
}

function SuspendPurposeByConsumerBody() {
  return (
    <p className="body-md">
      If you suspend it, you will no longer be able to use the associated
      E-Service for this Purpose. Are you sure you want to suspend this Purpose?
      <br />
      You will be able to reactivate it later.
    </p>
  );
}

function SuspendPurposeByProducerBody() {
  return (
    <p className="body-md">
      If you suspend it, the Consumer won&apos;t be able to use the associated
      E-Service for this Purpose. Are you sure you want to suspend this Purpose?
      <br />
      You will be able to reactivate it later.
    </p>
  );
}
