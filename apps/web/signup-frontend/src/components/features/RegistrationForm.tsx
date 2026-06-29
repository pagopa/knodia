import { useState } from "react";

import { Button, Checkbox, Chip, Link, TextField } from "@/components/ui";
import {
  PRIVACY_POLICY_PATH,
  TERMS_AND_CONDITIONS_PATH,
} from "@/config/legalLinks";
import { emailSchema } from "@/utils/validation";

interface RegistrationFormProps {
  errorMessage?: string;
  onSubmit: (email: string) => void;
}

const REQUIRED_FIELD_MESSAGE = "Required field";

export function RegistrationForm({
  errorMessage,
  onSubmit,
}: RegistrationFormProps) {
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [articlesAccepted, setArticlesAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isEmailValid = emailSchema.safeParse(email).success;
  const requiredError = (accepted: boolean) =>
    submitted && !accepted ? REQUIRED_FIELD_MESSAGE : undefined;

  return (
    <form
      className="flex w-[680px] max-w-full flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (isEmailValid && termsAccepted && articlesAccepted) onSubmit(email);
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
          <Checkbox
            errorMessage={requiredError(termsAccepted)}
            isSelected={termsAccepted}
            onChange={setTermsAccepted}
          >
            I have read, understood and agree to Knodia’s <TermsLink />
          </Checkbox>
          <Checkbox
            errorMessage={requiredError(articlesAccepted)}
            isSelected={articlesAccepted}
            onChange={setArticlesAccepted}
          >
            Pursuant to articles 1341 and 1342 of the italian civil code, I
            expressely approve articles 12 and 14 of Knodia’s <TermsLink />
          </Checkbox>
        </div>
        <div className="flex items-start gap-8">
          <TextField
            className="w-[272px]"
            errorMessage={errorMessage}
            label="Email address"
            onChange={setEmail}
            type="email"
            value={email}
          />
          <Button isDisabled={!isEmailValid} type="submit" variant="primary">
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
      Terms &amp; Conditions
    </Link>
  );
}
