import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { Modal, TextField } from "@/components/ui";
import {
  changeEmailErrorMessage,
  pollCurrentUserUntilEmail,
} from "@/services/changeEmail";
import { changeEmailMutationOptions } from "@/services/queries";

const emailSchema = z.email();

// TODO: revise this copy once email change also resets the account and re-sends new credentials.
const CHANGE_EMAIL_DESCRIPTION =
  "We will use this email address for operational communications related to your access to the prototype, such as password resets.";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ChangeEmailModal({
  isOpen,
  onOpenChange,
}: ChangeEmailModalProps) {
  // Mount the form only while open: closing unmounts it, so React resets its
  // state for free — no manual reset needed.
  return isOpen ? (
    <ChangeEmailModalContent onClose={() => onOpenChange(false)} />
  ) : null;
}

function ChangeEmailModalContent({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  // True from submit until the change is confirmed applied: keeps the modal open
  // with both buttons disabled while the async update propagates.
  const [isApplying, setIsApplying] = useState(false);
  const isEmailValid = emailSchema.safeParse(email).success;

  // If the component unmounts mid-apply (e.g. navigating away from /home), abort so
  // the request callbacks bail and the poll stops — no state is set after unmount.
  const applyAbort = useRef<AbortController | null>(null);
  useEffect(() => () => applyAbort.current?.abort(), []);

  const changeEmail = useMutation({
    ...changeEmailMutationOptions(),
    onError: (error) => {
      if (applyAbort.current?.signal.aborted) return;
      setErrorMessage(changeEmailErrorMessage(error));
      setIsApplying(false);
    },
    onSuccess: async () => {
      // The 204 only acks the request; wait until the new email is actually
      // reflected (and the banner, reading the same query, has updated) before
      // closing. Only then is it safe to release the modal.
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
    <Modal
      actionLabel="Change"
      description={CHANGE_EMAIL_DESCRIPTION}
      isActionDisabled={!isEmailValid || isApplying}
      isCancelDisabled={isApplying}
      isOpen
      onConfirm={() => {
        setErrorMessage(undefined);
        setIsApplying(true);
        applyAbort.current = new AbortController();
        changeEmail.mutate({ body: { email } });
      }}
      // Block dismissal (Cancel / Esc / overlay) while applying; otherwise close.
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
