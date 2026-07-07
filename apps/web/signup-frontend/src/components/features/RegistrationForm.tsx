import { revalidateLogic, useForm } from "@tanstack/react-form";

import { Button, Checkbox, Chip, Link, TextField } from "@/components/ui";
import {
  PRIVACY_POLICY_PATH,
  TERMS_AND_CONDITIONS_PATH,
} from "@/config/legalLinks";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import {
  registrationFormDefaultValues,
  registrationFormSchema,
} from "./registration-form";

interface RegistrationFormProps {
  errorMessage?: string;
  onEmailChange?: () => void;
  onSubmit: (email: string) => void;
}

export function RegistrationForm({
  errorMessage,
  onEmailChange,
  onSubmit,
}: RegistrationFormProps) {
  const form = useForm({
    defaultValues: registrationFormDefaultValues,
    onSubmit: ({ value }) => onSubmit(value.email),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: registrationFormSchema },
  });

  return (
    <form
      className="flex w-[680px] max-w-full flex-col gap-8"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="self-start">
        <Chip>SIGNUP</Chip>
      </div>
      <h1 className="text-style-hero text-neutral-graphite">
        One last step before entering Knodia
      </h1>
      <p className="text-style-intro text-neutral-graphite">
        Enter your email address to receive the credentials and access the
        prototype.
      </p>
      <div className="flex flex-col gap-6">
        <p className="text-style-small text-neutral-graphite">
          By submitting your email address, you agree to the{" "}
          <Link
            href={PRIVACY_POLICY_PATH}
            rel="noopener noreferrer"
            target="_blank"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex flex-col">
          <form.Field name="termsAccepted">
            {(field) => (
              <Checkbox
                errorMessage={getFieldErrorMessage(field.state.meta.errors)}
                isInvalid={!field.state.meta.isValid}
                isSelected={field.state.value}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              >
                I have read, understood and agree to Knodia’s <TermsLink />
              </Checkbox>
            )}
          </form.Field>
          <form.Field name="articlesAccepted">
            {(field) => (
              <Checkbox
                errorMessage={getFieldErrorMessage(field.state.meta.errors)}
                isInvalid={!field.state.meta.isValid}
                isSelected={field.state.value}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              >
                Pursuant to Articles 1341 and 1342 of the Italian Civil Code, I
                expressly approve Sections 12 and 14 of Knodia’s <TermsLink />
              </Checkbox>
            )}
          </form.Field>
        </div>
        <div className="flex items-start gap-8">
          <form.Field name="email">
            {(field) => (
              <TextField
                className="w-[272px]"
                // Server error (credentials request failure) takes precedence
                // over client validation in the shared error slot.
                errorMessage={
                  errorMessage ?? getFieldErrorMessage(field.state.meta.errors)
                }
                isInvalid={Boolean(errorMessage) || !field.state.meta.isValid}
                label="Email address"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(value) => {
                  field.handleChange(value);
                  onEmailChange?.();
                }}
                type="email"
                value={field.state.value}
              />
            )}
          </form.Field>
          <Button type="submit" variant="primary">
            Request credentials
          </Button>
        </div>
      </div>
    </form>
  );
}

function TermsLink() {
  return (
    <Link
      href={TERMS_AND_CONDITIONS_PATH}
      rel="noopener noreferrer"
      target="_blank"
      variant="caption"
    >
      Terms and Conditions
    </Link>
  );
}
