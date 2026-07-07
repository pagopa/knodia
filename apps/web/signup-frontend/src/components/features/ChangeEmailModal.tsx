import { revalidateLogic, useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { useEffect, useState } from "react";

import { Modal, TextField } from "@/components/ui";
import {
  changeEmailErrorMessage,
  isEmailAlreadyInUseError,
} from "@/services/changeEmail";
import { signupUserEmail } from "@/services/onboarding";
import {
  changeEmailMutationOptions,
  getCurrentSignupUserQuery,
} from "@/services/queries";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import {
  changeEmailFormDefaultValues,
  changeEmailFormSchema,
} from "./change-email-form";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 30_000;
const POLL_TIMEOUT_MESSAGE =
  "The email change is taking longer than expected. Reload the page to check whether it was applied.";

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
  // Modal-level failures show in the banner; the email-in-use error is a field
  // error owned by the form (set as an onServer error, auto-cleared on change).
  const [bannerError, setBannerError] = useState<string>();
  // True from submit until the change is confirmed applied, not just while in flight.
  const [isApplying, setIsApplying] = useState(false);

  const changeEmail = useMutation(changeEmailMutationOptions());

  const form = useForm({
    defaultValues: changeEmailFormDefaultValues,
    onSubmit: async ({ formApi, value }) => {
      setBannerError(undefined);
      setIsApplying(true);
      try {
        await changeEmail.mutateAsync({ body: { email: value.email } });
      } catch (error) {
        const axiosError = error as AxiosError;
        const message = changeEmailErrorMessage(axiosError);
        if (isEmailAlreadyInUseError(axiosError)) {
          formApi.setFieldMeta("email", (prev) => ({
            ...prev,
            errorMap: { ...prev.errorMap, onServer: { message } },
          }));
        } else {
          setBannerError(message);
        }
        setIsApplying(false);
      }
    },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: changeEmailFormSchema },
  });

  // Reactive submitted email for the polling/close logic (the field is locked
  // while applying, so this value stays fixed for the duration of the poll).
  const email = useStore(form.store, (state) => state.values.email);

  // The 204 only acks the request, so poll the current user until the new email
  // lands; gate on the ack so we don't poll while the request is still in flight.
  const currentUser = useQuery({
    ...getCurrentSignupUserQuery(),
    enabled: isApplying && changeEmail.isSuccess,
    refetchInterval: (query) =>
      signupUserEmail(query.state.data) === email ? false : POLL_INTERVAL_MS,
    staleTime: 0,
  });

  // Close only after the server acked: currentUser.data is the app-wide cache, so
  // without the isSuccess gate, submitting your current email would close at once.
  // onClose unmounts this component, so isApplying needn't be reset here.
  useEffect(() => {
    if (
      isApplying &&
      changeEmail.isSuccess &&
      signupUserEmail(currentUser.data) === email
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
      description="Changing your email address will reset your passwords. We will send new passwords to your new email address."
      errorMessage={bannerError}
      isActionDisabled={isApplying}
      isCancelDisabled={isApplying}
      isOpen
      onConfirm={() => void form.handleSubmit()}
      onOpenChange={(open) => {
        if (!open && !isApplying) onClose();
      }}
      title="Change email address"
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <TextField
              errorMessage={getFieldErrorMessage(field.state.meta.errors)}
              isDisabled={isApplying}
              isInvalid={!field.state.meta.isValid}
              label="New email address"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(value) => {
                field.handleChange(value);
                // The field has no validators, so revalidateLogic never clears
                // the server error on its own; drop it as the user retypes.
                field.setErrorMap({ onServer: undefined });
                setBannerError(undefined);
              }}
              type="email"
              value={field.state.value}
            />
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
