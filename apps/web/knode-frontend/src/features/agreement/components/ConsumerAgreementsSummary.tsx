import type { bffApi } from "@knodia/bff-client";

import { Button } from "@knodia/ui-kit/ui";
import { ArchiveIcon, CheckIcon, ProhibitIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { match } from "ts-pattern";

import { formatNumber } from "@/utils/formatters";

export function ConsumerAgreementsSummary({
  counters,
}: {
  counters: bffApi.ConsumerAgreements["counters"];
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-4">
      <AgreementCounterCard
        count={counters.activeAgreements}
        icon={<CheckIcon />}
        kind="success"
        label="Active"
        onViewAll={() =>
          navigate({
            search: { agreementState: "Active" },
            to: "/consumption/e-services",
          })
        }
      />
      <AgreementCounterCard
        count={counters.suspendedAgreements}
        icon={<ProhibitIcon />}
        kind="error"
        label="Suspended"
        onViewAll={() =>
          navigate({
            search: { agreementState: "Suspended" },
            to: "/consumption/e-services",
          })
        }
      />
      <AgreementCounterCard
        count={counters.archivedAgreements}
        icon={<ArchiveIcon />}
        kind="neutral"
        label="Archived"
        onViewAll={() => navigate({ to: "/consumption/agreements/archive" })}
      />
    </div>
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
          <span className="label-lg text-primary-light-mid-contrast">
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
