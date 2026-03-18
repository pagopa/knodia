import { Button } from "@knodia/ui-kit/ui";
import { ArchiveIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { match } from "ts-pattern";

import { PageHeader } from "@/components/PageHeader";
import { formatNumber } from "@/utils/formatters";

export const Route = createFileRoute("/_authenticated/consumption/agreements")({
  component: RouteComponent,
});

function AgreementCounterCard({
  count,
  icon,
  kind,
  label,
  onViewAll,
}: {
  count: number;
  icon: React.ReactNode;
  kind: "error" | "neutral" | "success";
  label: string;
  onViewAll?: () => void;
}) {
  const { cardBg, iconBg } = match(kind)
    .with("success", () => ({
      cardBg: "bg-success-light",
      iconBg: "bg-success-light-decorative text-success-light-high-contrast",
    }))
    .with("error", () => ({
      cardBg: "bg-error-light",
      iconBg: "bg-error-light-decorative text-error-light-high-contrast",
    }))
    .with("neutral", () => ({
      cardBg: "bg-secondary-light",
      iconBg:
        "bg-secondary-light-decorative text-secondary-light-high-contrast",
    }))
    .exhaustive();

  return (
    <div
      className={`${cardBg} flex flex-col gap-4 rounded-2xl pb-4 pl-4 pr-6 pt-4`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`${iconBg} flex size-8 items-center justify-center rounded-lg p-2 [&>svg]:size-4`}
          >
            {icon}
          </span>
          <span className="label-lg text-primary-light-low-contrast">
            {label}
          </span>
        </div>
        <span className="headline-md-em text-primary-light-high-contrast">
          {formatNumber(count)}
        </span>
      </div>
      <div>
        <Button
          hierarchy="neutral"
          isDisabled={!onViewAll}
          kind="outlined"
          onPress={onViewAll}
          size="sm"
        >
          View all
        </Button>
      </div>
    </div>
  );
}

function RouteComponent() {
  const navigate = useNavigate();

  // TODO: Replace mocked counters with real API data
  const counters = { active: 128, archived: 67, suspended: 35 };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        actions={
          <Button
            hierarchy="neutral"
            kind="ghost"
            onPress={() => navigate({ to: "/consumption/agreements/archive" })}
          >
            <ArchiveIcon />
            Archive
          </Button>
        }
        overline="Consumption"
        title="Agreements"
      />

      <div className="grid grid-cols-3 gap-4">
        <AgreementCounterCard
          count={counters.active}
          icon={<CheckIcon />}
          kind="success"
          label="Active"
        />
        <AgreementCounterCard
          count={counters.suspended}
          icon={<XIcon />}
          kind="error"
          label="Suspended"
        />
        <AgreementCounterCard
          count={counters.archived}
          icon={<ArchiveIcon />}
          kind="neutral"
          label="Archived"
        />
      </div>

      {/* TODO: Implement "Action needed" section */}
    </div>
  );
}
