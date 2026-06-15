import { useState } from "react";

import { Modal, TextField } from "@/components/ui";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ChangeEmailModal({
  isOpen,
  onOpenChange,
}: ChangeEmailModalProps) {
  const [email, setEmail] = useState("");
  const isValid = EMAIL_REGEX.test(email);

  const close = () => {
    setEmail("");
    onOpenChange(false);
  };

  return (
    <Modal
      actionLabel="Change"
      description="We will use this email address for operational communications related to your access to the prototype, such as password resets."
      isActionDisabled={!isValid}
      isOpen={isOpen}
      onConfirm={close}
      onOpenChange={(open) => !open && close()}
      title="Change email address"
    >
      <TextField
        label="New email address"
        onChange={setEmail}
        type="email"
        value={email}
      />
    </Modal>
  );
}
