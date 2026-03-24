import { Modal } from "@knodia/ui-kit/ui";

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LeaveConfirmModal({ isOpen, onCancel, onConfirm }: Props) {
  return (
    <Modal
      actionLabel="Leave anyway"
      cancelLabel="Cancel"
      description="Are you sure you want to leave the process? Your changes won't be saved."
      isDismissable
      isOpen={isOpen}
      kind="destructive"
      onClose={onCancel}
      onConfirm={onConfirm}
      onDismiss={onCancel}
      title="Leave process and discard changes"
    />
  );
}
