import type { bffApi } from "@knodia/bff-client";

import { Button } from "@knodia/ui-kit/ui";
import {
  ArchiveIcon,
  CheckIcon,
  type Icon,
  ProhibitIcon,
} from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { match } from "ts-pattern";

import { formatNumber } from "@/utils/formatters";

export function ConsumerAgreementsSummary({
  counters,
}: {
  counters: bffApi.ConsumerAgreements["counters"];
}) {
  const navigate = useNavigate();

  const { activeAgreements, archivedAgreements, suspendedAgreements } =
    counters;

  return (
    <div className="grid grid-cols-3 gap-4">
      <AgreementCounterCard
        count={activeAgreements}
        Icon={CheckIcon}
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
        count={suspendedAgreements}
        Icon={ProhibitIcon}
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
        count={archivedAgreements}
        Icon={ArchiveIcon}
        kind="neutral"
        label="Archived"
        onViewAll={() => navigate({ to: "/consumption/agreements/archive" })}
      />
    </div>
  );
}

function AgreementCounterCard({
  count,
  Icon,
  kind,
  label,
  onViewAll,
}: {
  count: number;
  Icon: Icon;
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
      className={`${cardBg} flex flex-col gap-counter-card-gap rounded-card pb-counter-card pl-counter-card pr-6 pt-counter-card`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`${iconBg} flex size-counter-card-icon items-center justify-center rounded-counter-card-icon p-2 [&>svg]:size-counter-card-svg`}
          >
            <Icon className="orion-only" />
            <Icon className="lynx-only" weight="bold" />
          </span>
          <span className="counter-card-label text-primary-light-mid-contrast">
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
