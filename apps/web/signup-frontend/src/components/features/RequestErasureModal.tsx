import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { Alert, Modal } from "@/components/ui";
import {
  deleteUserMutationOptions,
  getCurrentSignupUserQuery,
} from "@/services/queries";

const DELETE_USER_ERROR_MESSAGE =
  "Something went wrong while requesting the deletion of your data. Please try again.";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteUser = useMutation({
    ...deleteUserMutationOptions(),
    onSuccess: async () => {
      // refetchType "all": /registration's guard must read the fresh status.
      await queryClient.invalidateQueries({
        queryKey: getCurrentSignupUserQuery().queryKey,
        refetchType: "all",
      });
      await navigate({ to: "/registration" });
    },
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
      errorMessage={deleteUser.isError ? DELETE_USER_ERROR_MESSAGE : undefined}
      isActionDisabled={deleteUser.isPending}
      isOpen
      onConfirm={() => deleteUser.mutate({})}
      onOpenChange={onOpenChange}
      title="Request data erasure"
    />
  );
}
