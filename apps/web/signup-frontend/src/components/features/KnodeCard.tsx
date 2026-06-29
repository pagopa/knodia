import { ArrowForwardIcon, DeployedCodeIcon } from "@/components/icons";
import { Card, Link } from "@/components/ui";

interface KnodeCardProps {
  knodeName: string;
  organizationName: string;
  prototypeHref: string;
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
      <Link
        className="inline-flex items-center gap-2 self-start text-[18px] leading-[28px] font-medium tracking-normal text-primary-violet no-underline"
        href={prototypeHref}
        rel="noopener noreferrer"
        target="_blank"
      >
        Access the prototype
        <ArrowForwardIcon className="size-6" />
      </Link>
    </Card>
  );
}
