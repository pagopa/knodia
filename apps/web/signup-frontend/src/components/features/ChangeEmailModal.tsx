import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";

import { Modal, TextField } from "@/components/ui";
import { changeEmailErrorMessage } from "@/services/changeEmail";
import { changeEmailMutationOptions } from "@/services/queries";

const emailSchema = z.email();

interface ChangeEmailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ChangeEmailModal({
  isOpen,
  onOpenChange,
}: ChangeEmailModalProps) {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const isEmailValid = emailSchema.safeParse(email).success;

  // The modal stays mounted across open/close, so reset its state when it closes.
  const close = () => {
    setEmail("");
    setErrorMessage(undefined);
    onOpenChange(false);
  };

  const changeEmail = useMutation({
    ...changeEmailMutationOptions(),
    onError: (error) => setErrorMessage(changeEmailErrorMessage(error)),
    onSuccess: close,
  });

  return (
    <Modal
      actionLabel="Change"
      description="We will use this email address for operational communications related to your access to the prototype, such as password resets."
      isActionDisabled={!isEmailValid || changeEmail.isPending}
      isOpen={isOpen}
      onConfirm={() => changeEmail.mutate({ body: { email } })}
      onOpenChange={(open) => (open ? onOpenChange(true) : close())}
      title="Change email address"
    >
      <TextField
        errorMessage={errorMessage}
        label="New email address"
        onChange={(value) => {
          setEmail(value);
          setErrorMessage(undefined);
        }}
        type="email"
        value={email}
      />
    </Modal>
  );
}
