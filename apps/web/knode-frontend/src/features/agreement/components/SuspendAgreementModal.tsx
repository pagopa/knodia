import { Modal } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

export function SuspendAgreementModal({
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
      title="Suspend Agreement"
    >
      {match(suspendActor)
        .with("consumer", () => <SuspendAgreementByConsumerBody />)
        .with("producer", () => <SuspendAgreementByProducerBody />)
        .exhaustive()}
    </Modal>
  );
}

function SuspendAgreementByConsumerBody() {
  return (
    <p className="body-md">
      If you suspend it, the Producer won&apos;t be able to reactivate the
      Agreement on your behalf. Are you sure you want to suspend this Agreement?
      <br />
      You will be able to reactivate it later.
    </p>
  );
}

function SuspendAgreementByProducerBody() {
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
