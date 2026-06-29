import { type signupManagerApi } from "@knodia/signup-manager-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Modal, TextField } from "@/components/ui";
import {
  changeEmailErrorMessage,
  isEmailAlreadyInUseError,
} from "@/services/changeEmail";
import {
  changeEmailMutationOptions,
  getCurrentSignupUserQuery,
} from "@/services/queries";
import { emailSchema } from "@/utils/validation";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 30_000;
const POLL_TIMEOUT_MESSAGE =
  "The email change is taking longer than expected. Reload the page to check whether it was applied.";

// email lives only on the onboarded variant of the discriminated union.
const currentEmail = (user?: signupManagerApi.CurrentSignupUser) =>
  user && "email" in user ? user.email : undefined;

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
  const [email, setEmail] = useState("");
  // Email-in-use shows inline on the field; every other failure shows in the modal banner.
  const [fieldError, setFieldError] = useState<string>();
  const [bannerError, setBannerError] = useState<string>();
  // True from submit until the change is confirmed applied, not just while in flight.
  const [isApplying, setIsApplying] = useState(false);
  const isEmailValid = emailSchema.safeParse(email).success;

  const changeEmail = useMutation({
    ...changeEmailMutationOptions(),
    onError: (error) => {
      const message = changeEmailErrorMessage(error);
      if (isEmailAlreadyInUseError(error)) setFieldError(message);
      else setBannerError(message);
      setIsApplying(false);
    },
  });

  // The 204 only acks the request, so poll the current user until the new email
  // lands; gate on the ack so we don't poll while the request is still in flight.
  const currentUser = useQuery({
    ...getCurrentSignupUserQuery(),
    enabled: isApplying && changeEmail.isSuccess,
    refetchInterval: (query) =>
      currentEmail(query.state.data) === email ? false : POLL_INTERVAL_MS,
    staleTime: 0,
  });

  // Close only after the server acked: currentUser.data is the app-wide cache, so
  // without the isSuccess gate, submitting your current email would close at once.
  // onClose unmounts this component, so isApplying needn't be reset here.
  useEffect(() => {
    if (
      isApplying &&
      changeEmail.isSuccess &&
      currentEmail(currentUser.data) === email
    )
      onClose();
  }, [isApplying, changeEmail.isSuccess, currentUser.data, email, onClose]);

  // Stop waiting after the window elapses, so the modal never hangs open.
  useEffect(() => {
    if (!isApplying) return;
    const timer = setTimeout(() => {
      setBannerError(POLL_TIMEOUT_MESSAGE);
      setIsApplying(false);
    }, POLL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isApplying]);

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
