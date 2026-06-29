import { useMutation } from "@tanstack/react-query";

import { Modal } from "@/components/ui";
import { GENERIC_ERROR_MESSAGE } from "@/services/messages";
import { resetCredentialsMutationOptions } from "@/services/queries";

interface ResetPasswordsModalProps {
  email: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ResetPasswordsModal({
  email,
  isOpen,
  onOpenChange,
}: ResetPasswordsModalProps) {
  if (!isOpen) return null;

  return <ResetPasswordsDialog email={email} onOpenChange={onOpenChange} />;
}

function ResetPasswordsDialog({
  email,
  onOpenChange,
}: {
  email: string;
  onOpenChange: (isOpen: boolean) => void;
}) {
  // The 204 only acks the request; the actual Cognito reset happens async and is
  // not observable here, so we trust the ack and close the modal on success.
  const resetCredentials = useMutation({
    ...resetCredentialsMutationOptions(),
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Modal
      actionLabel="Reset"
      description={`You will receive temporary passwords or a link to create new ones at ${email}.`}
      errorMessage={
        resetCredentials.isError ? GENERIC_ERROR_MESSAGE : undefined
      }
      isActionDisabled={resetCredentials.isPending}
      isCancelDisabled={resetCredentials.isPending}
      isOpen
      onConfirm={() => resetCredentials.mutate({})}
      onOpenChange={onOpenChange}
      title="Reset passwords"
    />
  );
}
