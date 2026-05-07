import type { bffApi } from "@knodia/bff-client";

import { Chip, type ChipProps } from "@knodia/ui-kit/ui";
import { ArchiveIcon, CheckIcon, ProhibitIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

type PurposeStateChipProps = { type?: ChipProps["type"] } & (
  | { label?: never; state: Exclude<bffApi.PurposeState, "Archived"> }
  | { label?: string; state: Extract<bffApi.PurposeState, "Archived"> }
);

export function PurposeStateChip(props: PurposeStateChipProps) {
  const type = props.type ?? "light";
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
    .with({ state: "Archived" }, ({ label }) => (
      <Chip
        icon={<ArchiveIcon />}
        kind="neutral"
        label={label ?? "Archived"}
        type={type}
      />
    ))
    .exhaustive();
}
