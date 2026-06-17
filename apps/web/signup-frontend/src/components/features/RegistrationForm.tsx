import { useState } from "react";
import { z } from "zod";

import { Button, Chip, Link, TextField } from "@/components/ui";

const emailSchema = z.email();

interface RegistrationFormProps {
  errorMessage?: string;
  onSubmit: (email: string) => void;
}

export function RegistrationForm({
  errorMessage,
  onSubmit,
}: RegistrationFormProps) {
  const [email, setEmail] = useState("");
  const isEmailValid = emailSchema.safeParse(email).success;

  return (
    <form
      className="flex w-[520px] max-w-full flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (isEmailValid) onSubmit(email);
      }}
    >
      <Chip>SIGNUP</Chip>
      <h1 className="text-style-hero text-neutral-graphite">
        One last step before entering Knodia
      </h1>
      <div className="flex flex-col gap-4">
        <p className="text-style-body text-neutral-medium-gray">
          Enter your email address to receive the credentials and access the
          prototype.
        </p>
        {/* TODO(KN-783): confirm consent copy and link target with design */}
        <p className="text-style-caption text-neutral-medium-gray">
          By submitting your email address, you agree to our{" "}
          <Link href="#">Privacy Policy & Terms & Conditions</Link>.
        </p>
      </div>
      <div className="flex items-start gap-4">
        <TextField
          className="flex-1"
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
    </form>
  );
}
