import type { bffApi } from "@knodia/bff-client";

import { Chip, type ChipProps } from "@knodia/ui-kit/ui";
import { ArchiveIcon, CheckIcon, ProhibitIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

import { formatNumericDate } from "@/utils/formatters";

export function PurposeStateChip({
  archivedAt,
  state,
  type = "light",
}: {
  archivedAt?: string;
  state: bffApi.PurposeState;
  type?: ChipProps["type"];
}) {
  return match(state)
    .with("Active", () => (
      <Chip icon={<CheckIcon />} kind="success" label="Active" type={type} />
    ))
    .with("Suspended", () => (
      <Chip
        icon={<ProhibitIcon />}
        kind="error"
        label="Suspended"
        type={type}
      />
    ))
    .with("Archived", () => (
      <Chip
        icon={<ArchiveIcon />}
        kind="neutral"
        label={
          archivedAt ? `Archived ${formatNumericDate(archivedAt)}` : "Archived"
        }
        type={type}
      />
    ))
    .exhaustive();
}
