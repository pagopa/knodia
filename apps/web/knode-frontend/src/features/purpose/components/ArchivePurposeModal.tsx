import { Modal } from "@knodia/ui-kit/ui";

export function ArchivePurposeModal({
  isError,
  isOpen,
  isPending,
  onConfirm,
  onOpenChange,
}: {
  isError: boolean;
  isOpen: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (isOpen: boolean) => void;
}) {
  return (
    <Modal
      actionLabel="Archive"
      cancelLabel="Cancel"
      confirmButtonProps={{ isPending }}
      isDismissable
      isOpen={isOpen}
      kind="destructive"
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      showErrorBanner={isError}
      title="Archive Purpose"
    >
      <p className="body-md">
        Are you sure you want to archive this Purpose?
        <br />
        This action cannot be undone.
      </p>
    </Modal>
  );
}
