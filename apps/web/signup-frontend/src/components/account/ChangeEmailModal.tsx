import { Modal, TextField } from "@/components/ui";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ChangeEmailModal({
  isOpen,
  onOpenChange,
}: ChangeEmailModalProps) {
  // TODO: enable and add validation once the change-email route is wired
  return (
    <Modal
      actionLabel="Change"
      description="We will use this email address for operational communications related to your access to the prototype, such as password resets."
      isActionDisabled
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Change email address"
    >
      <TextField label="New email address" type="email" />
    </Modal>
  );
}
