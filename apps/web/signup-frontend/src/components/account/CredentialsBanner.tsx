interface CredentialsBannerProps {
  email: string;
}

export function CredentialsBanner({ email }: CredentialsBannerProps) {
  return (
    <div className="flex flex-col gap-4 rounded-card bg-deep-violet p-12">
      <h2 className="text-style-subheading text-neutral-white">
        About your credentials
      </h2>
      <p className="text-style-body text-neutral-white">
        We have sent your access credentials to{" "}
        <span className="font-bold">{email}</span>.
        <br />
        <br />
        Have not received them or lost them?
        <br />
        Access the prototype and use “Forgot your password?” to request a new
        one.
      </p>
    </div>
  );
}
