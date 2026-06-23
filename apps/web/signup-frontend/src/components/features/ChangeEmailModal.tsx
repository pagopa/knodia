import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { Modal, TextField } from "@/components/ui";
import {
  changeEmailErrorMessage,
  pollCurrentUserUntilEmail,
} from "@/services/changeEmail";
import { changeEmailMutationOptions } from "@/services/queries";
import { emailSchema } from "@/utils/validation";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ChangeEmailModal({
  isOpen,
  onOpenChange,
}: ChangeEmailModalProps) {
  return isOpen ? (
    <ChangeEmailModalContent onClose={() => onOpenChange(false)} />
  ) : null;
}

function ChangeEmailModalContent({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  // True from submit until the change is confirmed applied, not just while in flight.
  const [isApplying, setIsApplying] = useState(false);
  const isEmailValid = emailSchema.safeParse(email).success;

  const applyAbort = useRef<AbortController | null>(null);
  useEffect(() => () => applyAbort.current?.abort(), []);

  const changeEmail = useMutation({
    ...changeEmailMutationOptions(),
    onError: (error) => {
      if (applyAbort.current?.signal.aborted) return;
      // TODO: route the generic error to a banner inside the Modal component (pending design); email-already-in-use stays inline on the TextField.
      setErrorMessage(changeEmailErrorMessage(error));
      setIsApplying(false);
    },
    onSuccess: async () => {
      // The 204 only acks the request; wait until the new email lands before closing.
      const applied = await pollCurrentUserUntilEmail(queryClient, email, {
        signal: applyAbort.current?.signal,
      });
      if (applyAbort.current?.signal.aborted) return;
      if (!applied) {
        setErrorMessage(
          "The email change is taking longer than expected. Reload the page to check whether it was applied.",
        );
        setIsApplying(false);
        return;
      }
      onClose();
    },
  });

  return (
    // TODO: confirm this copy with the designers.
    <Modal
      actionLabel="Change"
      description="Changing your email address will reset your access: new credentials will be sent to the new address."
      isActionDisabled={!isEmailValid || isApplying}
      isCancelDisabled={isApplying}
      isOpen
      onConfirm={() => {
        setErrorMessage(undefined);
        setIsApplying(true);
        applyAbort.current = new AbortController();
        changeEmail.mutate({ body: { email } });
      }}
      onOpenChange={(open) => {
        if (!open && !isApplying) onClose();
      }}
      title="Change email address"
    >
      <TextField
        errorMessage={errorMessage}
        isDisabled={isApplying}
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
