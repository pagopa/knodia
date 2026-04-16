import type { bffApi } from "@knodia/bff-client";

import { Chip, type ChipProps } from "@knodia/ui-kit/ui";
import { CheckIcon, ProhibitIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

export function AgreementStateChip({
  state,
  suspendedByConsumerAt,
  suspendedByProducerAt,
  type = "bright",
}: {
  state: bffApi.AgreementState;
  suspendedByConsumerAt?: null | string;
  suspendedByProducerAt?: null | string;
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
        label={getSuspendedLabel(suspendedByConsumerAt, suspendedByProducerAt)}
        type={type}
      />
    ))
    .with("Archived", () => {
      console.warn("Unhandled agreement state: Archived");
      return null;
    })
    .with("PendingConsumerOperatorIdentification", () => {
      console.warn(
        "Unhandled agreement state: PendingConsumerOperatorIdentification",
      );
      return null;
    })
    .exhaustive();
}

function getSuspendedLabel(
  suspendedByConsumerAt?: null | string,
  suspendedByProducerAt?: null | string,
): string {
  const byConsumer = suspendedByConsumerAt != null;
  const byProducer = suspendedByProducerAt != null;

  if (byConsumer && byProducer) return "Suspended";
  if (byProducer) return "Suspended by producer";
  if (byConsumer) return "Suspended by consumer";
  return "Suspended";
}
