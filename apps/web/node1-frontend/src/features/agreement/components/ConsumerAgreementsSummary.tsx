import { Button, Empty } from "@knodia/ui-kit/ui";
import {
  ArchiveIcon,
  CheckIcon,
  SelectionPlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { match } from "ts-pattern";

import { formatNumber } from "@/utils/formatters";

export function ConsumerAgreementsSummary() {
  const navigate = useNavigate();

  // TODO: Replace mocked counters with real API data
  const counters = { active: 128, archived: 67, suspended: 35 };
  const hasAgreements =
    counters.active > 0 || counters.suspended > 0 || counters.archived > 0;

  if (!hasAgreements) {
    return (
      <Empty
        action={{
          as: "button",
          hierarchy: "brand",
          kind: "filled",
          label: "Search new E-Services",
          onClick: () => navigate({ to: "/consumption/e-services/search" }),
        }}
        description="Search for an E-Service to request an Agreement."
        icon={<SelectionPlusIcon />}
        title="You don't have any Agreements yet."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {/* TODO: Add agreement status filter search param when navigating to e-services list */}
        <AgreementCounterCard
          count={counters.active}
          icon={<CheckIcon />}
          kind="success"
          label="Active"
          onViewAll={() => navigate({ to: "/consumption/e-services" })}
        />
        <AgreementCounterCard
          count={counters.suspended}
          icon={<XIcon />}
          kind="error"
          label="Suspended"
          onViewAll={() => navigate({ to: "/consumption/e-services" })}
        />
        <AgreementCounterCard
          count={counters.archived}
          icon={<ArchiveIcon />}
          kind="neutral"
          label="Archived"
          onViewAll={() => navigate({ to: "/consumption/agreements/archive" })}
        />
      </div>

      {/* TODO: Implement "Action needed" section */}
    </>
  );
}

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
  onViewAll: () => void;
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
