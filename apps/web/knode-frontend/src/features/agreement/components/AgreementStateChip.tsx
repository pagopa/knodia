import type { bffApi } from "@knodia/bff-client";

import { Chip, type ChipProps } from "@knodia/ui-kit/ui";
import { ArchiveIcon, CheckIcon, ProhibitIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

export function AgreementStateChip({
  state,
  type = "bright",
}: {
  state: bffApi.AgreementState;
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
        label="Archived"
        type={type}
      />
    ))
    .with("PendingConsumerOperatorIdentification", () => {
      console.warn(
        "Unhandled agreement state: PendingConsumerOperatorIdentification",
      );
      return null;
    })
    .exhaustive();
}
