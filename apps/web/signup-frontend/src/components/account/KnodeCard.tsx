import { ArrowForwardIcon, DeployedCodeIcon } from "@/components/icons";
import { Button, Card } from "@/components/ui";

interface KnodeCardProps {
  knodeName: string;
  organizationName: string;
  // TODO(KN-753): wire to the real prototype URL (hosted outside the signup app).
  prototypeHref?: string;
  username: string;
}

export function KnodeCard({
  knodeName,
  organizationName,
  prototypeHref,
  username,
}: KnodeCardProps) {
  return (
    <Card className="flex min-h-[330px] flex-col justify-center gap-8">
      <div className="flex flex-col gap-6">
        <span className="flex size-[60px] items-center justify-center rounded-full bg-secondary-soft-quartz">
          <DeployedCodeIcon className="size-8 text-neutral-graphite" />
        </span>
        <div className="flex flex-col gap-4">
          <h3 className="text-style-intro text-neutral-graphite">
            {knodeName} Knode
          </h3>
          <p className="text-style-body text-neutral-medium-gray">
            You will access this Knode as part of{" "}
            <span className="font-bold">{organizationName}</span> with the
            username <span className="font-bold">{username}</span>.
          </p>
        </div>
      </div>
      <Button
        className="gap-2 self-start"
        isDisabled={!prototypeHref}
        onPress={() => prototypeHref && window.open(prototypeHref, "_blank")}
        variant="text"
      >
        Access the prototype
        <ArrowForwardIcon className="size-6" />
      </Button>
    </Card>
  );
}
