import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { Modal, TextField } from "@/components/ui";
import {
  changeEmailErrorMessage,
  isEmailAlreadyInUseError,
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
  // Email-in-use shows inline on the field; every other failure shows in the modal banner.
  const [fieldError, setFieldError] = useState<string>();
  const [bannerError, setBannerError] = useState<string>();
  // True from submit until the change is confirmed applied, not just while in flight.
  const [isApplying, setIsApplying] = useState(false);
  const isEmailValid = emailSchema.safeParse(email).success;

  const applyAbort = useRef<AbortController | null>(null);
  useEffect(() => () => applyAbort.current?.abort(), []);

  const changeEmail = useMutation({
    ...changeEmailMutationOptions(),
    onError: (error) => {
      if (applyAbort.current?.signal.aborted) return;
      const message = changeEmailErrorMessage(error);
      if (isEmailAlreadyInUseError(error)) setFieldError(message);
      else setBannerError(message);
      setIsApplying(false);
    },
    onSuccess: async () => {
      // The 204 only acks the request; wait until the new email lands before closing.
      const applied = await pollCurrentUserUntilEmail(queryClient, email, {
        signal: applyAbort.current?.signal,
      });
      if (applyAbort.current?.signal.aborted) return;
      if (!applied) {
        setBannerError(
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
      description="Changing your email address will reset your passwords. We will send password reset links to your new email address."
      errorMessage={bannerError}
      isActionDisabled={!isEmailValid || isApplying}
      isCancelDisabled={isApplying}
      isOpen
      onConfirm={() => {
        setFieldError(undefined);
        setBannerError(undefined);
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
        errorMessage={fieldError}
        isDisabled={isApplying}
        label="New email address"
        onChange={(value) => {
          setEmail(value);
          setFieldError(undefined);
          setBannerError(undefined);
        }}
        type="email"
        value={email}
      />
    </Modal>
  );
}
