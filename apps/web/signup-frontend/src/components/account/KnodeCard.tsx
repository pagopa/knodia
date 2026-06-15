import { ArrowForwardIcon, DeployedCodeIcon } from "@/components/icons";
import { Button, Card } from "@/components/ui";

interface KnodeCardProps {
  knodeName: string;
  organizationName: string;
  // The prototype is hosted outside the signup app; left optional until the URL is wired.
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
    <Card className="flex flex-col gap-6">
      <span className="flex size-[60px] items-center justify-center rounded-full bg-secondary-soft-quartz">
        <DeployedCodeIcon className="size-8 text-deep-violet" />
      </span>
      <div className="flex flex-col gap-2">
        <h3 className="text-style-intro text-neutral-graphite">
          {knodeName} Knode
        </h3>
        <p className="text-style-body text-neutral-medium-gray">
          You will access this Knode as part of{" "}
          <span className="font-semibold">{organizationName}</span> with the
          username <span className="font-semibold">{username}</span>.
        </p>
      </div>
      <Button
        className="gap-2 self-start"
        onPress={() => prototypeHref && window.open(prototypeHref, "_blank")}
        variant="text"
      >
        Access the prototype
        <ArrowForwardIcon className="size-6" />
      </Button>
    </Card>
  );
}
