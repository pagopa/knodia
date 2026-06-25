import { useMutation } from "@tanstack/react-query";

import { Alert, Modal } from "@/components/ui";
import { useNavigateAfterSignupChange } from "@/hooks/useNavigateAfterSignupChange";
import { GENERIC_ERROR_MESSAGE } from "@/services/messages";
import { deleteUserMutationOptions } from "@/services/queries";

interface RequestErasureDialogProps {
  onOpenChange: (isOpen: boolean) => void;
}

interface RequestErasureModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RequestErasureModal({
  isOpen,
  onOpenChange,
}: RequestErasureModalProps) {
  if (!isOpen) return null;

  return <RequestErasureDialog onOpenChange={onOpenChange} />;
}

function RequestErasureDialog({ onOpenChange }: RequestErasureDialogProps) {
  const navigateAfterChange = useNavigateAfterSignupChange();

  const deleteUser = useMutation({
    ...deleteUserMutationOptions(),
    onSuccess: () => navigateAfterChange("/registration"),
  });

  return (
    <Modal
      actionLabel="Request erasure"
      description={
        <Alert>
          If you confirm this request, your access to the prototype will be
          removed and your data will be permanently erased. This process may
          take up to 30 days.
        </Alert>
      }
      errorMessage={deleteUser.isError ? GENERIC_ERROR_MESSAGE : undefined}
      isActionDisabled={deleteUser.isPending}
      isCancelDisabled={deleteUser.isPending}
      isOpen
      onConfirm={() => deleteUser.mutate({})}
      onOpenChange={onOpenChange}
      title="Request data erasure"
    />
  );
}
