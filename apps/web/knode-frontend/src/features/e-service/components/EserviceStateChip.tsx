import type { bffApi } from "@knodia/bff-client";

import { Chip } from "@knodia/ui-kit/ui";
import { ArchiveIcon, CheckIcon, ProhibitIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

import { formatNumericDate } from "@/utils/formatters";

export function EserviceStateChip({
  archivedAt,
  state,
}: {
  archivedAt?: string;
  state: bffApi.EserviceVersionState;
}) {
  return match(state)
    .with("Active", () => (
      <Chip icon={<CheckIcon />} kind="brand" label="Available" type="light" />
    ))
    .with("Suspended", () => (
      <Chip
        icon={<ProhibitIcon />}
        kind="neutral"
        label="Unavailable"
        type="light"
      />
    ))
    .with("Archived", () => (
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
