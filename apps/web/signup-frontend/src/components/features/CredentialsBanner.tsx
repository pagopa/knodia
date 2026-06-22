import { MailAsteriskIcon } from "@/components/icons";

interface CredentialsBannerProps {
  email: string;
}

export function CredentialsBanner({ email }: CredentialsBannerProps) {
  return (
    <div className="flex items-center gap-10 rounded-card bg-deep-violet p-12">
      <MailAsteriskIcon className="size-[92px] shrink-0 text-primary-violet-60" />
      <div className="flex max-w-[934px] flex-col gap-4">
        <h2 className="text-style-subheading text-neutral-white">
          Your access credentials
        </h2>
        <p className="text-style-body text-neutral-white">
          We have sent your access credentials to{" "}
          <span className="font-bold">{email}</span>.
          <br />
          You can now use them to access Orion Knode and Lynx Knode.
          <br />
          <br />
          Have not received them or cannot find them anymore? Access the
          prototype, go to Log in, then choose “Forgot your password?” to
          request a new one.
        </p>
      </div>
    </div>
  );
}
