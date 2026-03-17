import type { bffApi } from "@knodia/bff-client";

import { Chip } from "@knodia/ui-kit/ui";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

export function AgreementStateChip({
  state,
}: {
  state: bffApi.AgreementState;
}) {
  return (
    match(state)
      .with("Active", () => (
        <Chip
          icon={<CheckIcon />}
          kind="success"
          label="Active"
          type="bright"
        />
      ))
      .with("Suspended", () => (
        <Chip icon={<XIcon />} kind="error" label="Suspended" type="bright" />
      ))
      // TODO: Currently only Active and Suspended are handled
      .with("Archived", () => {
        throw new Error("Unexpected agreement state: Archived");
      })
      .exhaustive()
  );
}
