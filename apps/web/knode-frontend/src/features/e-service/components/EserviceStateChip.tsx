import type { bffApi } from "@knodia/bff-client";

import { Chip } from "@knodia/ui-kit/ui";
import { ArchiveIcon, CheckIcon, ProhibitIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

import { formatNumericDate } from "@/utils/formatters";

type EserviceStateChipProps =
  | { archivedAt?: never; state: bffApi.EserviceVersionState }
  | { archivedAt?: string; state: "Archived" };

export function EserviceStateChip(props: EserviceStateChipProps) {
  return match(props)
    .with({ state: "Active" }, () => (
      <Chip icon={<CheckIcon />} kind="brand" label="Available" type="light" />
    ))
    .with({ state: "Suspended" }, () => (
      <Chip
        icon={<ProhibitIcon />}
        kind="neutral"
        label="Unavailable"
        type="light"
      />
    ))
    .with({ state: "Archived" }, ({ archivedAt }) => (
      <Chip
        icon={<ArchiveIcon />}
        kind="neutral"
        label={
          archivedAt ? `Archived ${formatNumericDate(archivedAt)}` : "Archived"
        }
        type="light"
      />
    ))
    .exhaustive();
}
