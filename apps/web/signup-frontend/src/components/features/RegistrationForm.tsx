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
      className="flex w-[680px] max-w-full flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (isEmailValid) onSubmit(email);
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
      {/* TODO(KN-783): set the real Terms & Conditions link target */}
      <p className="text-style-small text-neutral-graphite">
        By submitting your email address, you agree to{" "}
        <Link href="#">Knodia’s Terms &amp; Conditions</Link>.
      </p>
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
    </form>
  );
}
