import type { bffApi } from "@knodia/bff-client";

import { Chip, type ChipProps } from "@knodia/ui-kit/ui";
import { ArchiveIcon, CheckIcon, ProhibitIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

import { formatNumericDate } from "@/utils/formatters";

type AgreementStateChipProps = { type?: ChipProps["type"] } & (
  | { archivedAt?: never; state: Exclude<bffApi.AgreementState, "Archived"> }
  | { archivedAt?: string; state: Extract<bffApi.AgreementState, "Archived"> }
);

export function AgreementStateChip(props: AgreementStateChipProps) {
  const type = props.type ?? "bright";
  return match(props)
    .with({ state: "Active" }, () => (
      <Chip icon={<CheckIcon />} kind="success" label="Active" type={type} />
    ))
    .with({ state: "Suspended" }, () => (
      <Chip
        icon={<ProhibitIcon />}
        kind="error"
        label="Suspended"
        type={type}
      />
    ))
    .with({ state: "Archived" }, ({ archivedAt }) => (
      <Chip
        icon={<ArchiveIcon />}
        kind="neutral"
        label={
          archivedAt ? `Archived ${formatNumericDate(archivedAt)}` : "Archived"
        }
        type={type}
      />
    ))
    .with({ state: "PendingConsumerOperatorIdentification" }, () => {
      console.warn(
        "Unhandled agreement state: PendingConsumerOperatorIdentification",
      );
      return null;
    })
    .exhaustive();
}
