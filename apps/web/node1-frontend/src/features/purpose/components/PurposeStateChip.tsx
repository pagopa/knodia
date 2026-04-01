import type { bffApi } from "@knodia/bff-client";

import { Chip, type ChipProps } from "@knodia/ui-kit/ui";
import { ArchiveIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

export function PurposeStateChip({
  state,
  type = "light",
}: {
  state: bffApi.PurposeState;
  type?: ChipProps["type"];
}) {
  return match(state)
    .with("Active", () => (
      <Chip icon={<CheckIcon />} kind="success" label="Active" type={type} />
    ))
    .with("Suspended", () => (
      <Chip icon={<XIcon />} kind="error" label="Suspended" type={type} />
    ))
    .with("Archived", () => (
      <Chip
        icon={<ArchiveIcon />}
        kind="neutral"
        label="Archived"
        type={type}
      />
    ))
    .exhaustive();
}
