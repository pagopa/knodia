import type { bffApi } from "@knodia/bff-client";

import { Chip, type ChipProps } from "@knodia/ui-kit/ui";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

export function AgreementStateChip({
  state,
  type = "bright",
}: {
  state: bffApi.AgreementState;
  type?: ChipProps["type"];
}) {
  return (
    match(state)
      .with("Active", () => (
        <Chip icon={<CheckIcon />} kind="success" label="Active" type={type} />
      ))
      .with("Suspended", () => (
        <Chip icon={<XIcon />} kind="error" label="Suspended" type={type} />
      ))
      // TODO: Only Active and Suspended states are supported. Archived is not handled yet.
      .with("Archived", () => {
        console.warn("Unhandled agreement state: Archived");
        return null;
      })
      .exhaustive()
  );
}
