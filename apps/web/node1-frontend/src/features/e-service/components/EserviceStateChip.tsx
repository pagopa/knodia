import type { EserviceVersionState } from "@knodia/bff-client";

import { Chip } from "@knodia/ui-kit/ui";
import { ArchiveIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

export function EserviceStateChip({ state }: { state: EserviceVersionState }) {
  return match(state)
    .with("Active", () => (
      <Chip icon={<CheckIcon />} kind="brand" label="Available" type="light" />
    ))
    .with("Suspended", () => (
      <Chip icon={<XIcon />} kind="neutral" label="Unavailable" type="light" />
    ))
    .with("Archived", () => (
      <Chip
        icon={<ArchiveIcon />}
        kind="neutral"
        label="Archived"
        type="light"
      />
    ))
    .exhaustive();
}
