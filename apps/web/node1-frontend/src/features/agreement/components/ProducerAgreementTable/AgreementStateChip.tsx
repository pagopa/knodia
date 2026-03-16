import { Chip } from "@knodia/ui-kit/ui";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

import type { ProducerAgreementState } from "@/features/agreement/models/types";

export function AgreementStateChip({
  state,
}: {
  state: ProducerAgreementState;
}) {
  return match(state)
    .with("Active", () => (
      <Chip icon={<CheckIcon />} kind="success" label="Active" type="bright" />
    ))
    .with("Suspended", () => (
      <Chip icon={<XIcon />} kind="error" label="Suspended" type="bright" />
    ))
    .exhaustive();
}
