import { ArrowForwardIcon, MailAsteriskIcon } from "@/components/icons";
import { Button } from "@/components/ui";

interface CredentialsBannerProps {
  email: string;
  onChangeEmail: () => void;
  onResetPasswords: () => void;
}

export function CredentialsBanner({
  email,
  onChangeEmail,
  onResetPasswords,
}: CredentialsBannerProps) {
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
          Have not received them or cannot find them anymore?
          <br />
          Access the prototype, go to Log in, then choose “Forgot your
          password?” to request a new one.
        </p>
        <BannerAction label="Reset passwords" onPress={onResetPasswords} />
        <BannerAction label="Change email address" onPress={onChangeEmail} />
      </div>
    </div>
  );
}

function BannerAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Button
      className="gap-2 self-start text-secondary-muted-amber-30 hover:text-secondary-muted-amber-30"
      onPress={onPress}
      variant="text"
    >
      {label}
      <ArrowForwardIcon className="size-6" />
    </Button>
  );
}
