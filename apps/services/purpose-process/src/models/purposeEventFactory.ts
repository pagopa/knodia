import type { CorrelationId } from "@knodia/common-models/ids";
import type { NewEventStorePurposeEvent } from "@knodia/db-event-store-writer/purpose";

import { type Purpose, toPurposeV1 } from "@knodia/purpose-models";

export const createPurposeActivatedV1Event = (
  purpose: Purpose,
  correlationId: CorrelationId,
): NewEventStorePurposeEvent => ({
  correlationId,
  currentMetadataVersion: undefined,
  event: {
    data: {
      purpose: toPurposeV1(purpose),
    },
    type: "PurposeActivatedV1",
  },
  streamId: purpose.id,
});

export const createPurposeReactivatedByConsumerV1Event = (
  purpose: Purpose,
  currentVersion: number,
  correlationId: CorrelationId,
): NewEventStorePurposeEvent => ({
  correlationId,
  currentMetadataVersion: currentVersion,
  event: {
    data: {
      purpose: toPurposeV1(purpose),
    },
    type: "PurposeReactivatedByConsumerV1",
  },
  streamId: purpose.id,
});

export const createPurposeReactivatedByProducerV1Event = (
  purpose: Purpose,
  currentVersion: number,
  correlationId: CorrelationId,
): NewEventStorePurposeEvent => ({
  correlationId,
  currentMetadataVersion: currentVersion,
  event: {
    data: {
      purpose: toPurposeV1(purpose),
    },
    type: "PurposeReactivatedByProducerV1",
  },
  streamId: purpose.id,
});

export const createPurposeSuspendedByConsumerV1Event = (
  purpose: Purpose,
  currentVersion: number,
  correlationId: CorrelationId,
): NewEventStorePurposeEvent => ({
  correlationId,
  currentMetadataVersion: currentVersion,
  event: {
    data: {
      purpose: toPurposeV1(purpose),
    },
    type: "PurposeSuspendedByConsumerV1",
  },
  streamId: purpose.id,
});

export const createPurposeSuspendedByProducerV1Event = (
  purpose: Purpose,
  currentVersion: number,
  correlationId: CorrelationId,
): NewEventStorePurposeEvent => ({
  correlationId,
  currentMetadataVersion: currentVersion,
  event: {
    data: {
      purpose: toPurposeV1(purpose),
    },
    type: "PurposeSuspendedByProducerV1",
  },
  streamId: purpose.id,
});
