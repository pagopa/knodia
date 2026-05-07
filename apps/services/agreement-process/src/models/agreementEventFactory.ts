import type { CorrelationId } from "@knodia/common-models/ids";
import type { NewEventStoreAgreementEvent } from "@knodia/db-event-store-writer/agreement";

import { type Agreement, toAgreementV1 } from "@knodia/agreement-models";

export const createAgreementActivatedV1Event = (
  agreement: Agreement,
  correlationId: CorrelationId,
): NewEventStoreAgreementEvent => ({
  correlationId,
  currentMetadataVersion: undefined,
  event: {
    data: {
      agreement: toAgreementV1(agreement),
    },
    type: "AgreementActivatedV1",
  },
  streamId: agreement.id,
});

export const createAgreementActivatedByConsumerOperatorV1Event = (
  agreement: Agreement,
  currentVersion: number,
  correlationId: CorrelationId,
): NewEventStoreAgreementEvent => ({
  correlationId,
  currentMetadataVersion: currentVersion,
  event: {
    data: {
      agreement: toAgreementV1(agreement),
    },
    type: "AgreementActivatedByConsumerOperatorV1",
  },
  streamId: agreement.id,
});

export const createAgreementCreatedPendingConsumerOperatorIdentificationV1Event =
  (
    agreement: Agreement,
    correlationId: CorrelationId,
  ): NewEventStoreAgreementEvent => ({
    correlationId,
    currentMetadataVersion: undefined,
    event: {
      data: {
        agreement: toAgreementV1(agreement),
      },
      type: "AgreementCreatedPendingConsumerOperatorIdentificationV1",
    },
    streamId: agreement.id,
  });

export const createAgreementReactivatedByConsumerV1Event = (
  agreement: Agreement,
  currentVersion: number,
  correlationId: CorrelationId,
): NewEventStoreAgreementEvent => ({
  correlationId,
  currentMetadataVersion: currentVersion,
  event: {
    data: {
      agreement: toAgreementV1(agreement),
    },
    type: "AgreementReactivatedByConsumerV1",
  },
  streamId: agreement.id,
});

export const createAgreementReactivatedByProducerV1Event = (
  agreement: Agreement,
  currentVersion: number,
  correlationId: CorrelationId,
): NewEventStoreAgreementEvent => ({
  correlationId,
  currentMetadataVersion: currentVersion,
  event: {
    data: {
      agreement: toAgreementV1(agreement),
    },
    type: "AgreementReactivatedByProducerV1",
  },
  streamId: agreement.id,
});

export const createAgreementSuspendedByConsumerV1Event = (
  agreement: Agreement,
  currentVersion: number,
  correlationId: CorrelationId,
): NewEventStoreAgreementEvent => ({
  correlationId,
  currentMetadataVersion: currentVersion,
  event: {
    data: {
      agreement: toAgreementV1(agreement),
    },
    type: "AgreementSuspendedByConsumerV1",
  },
  streamId: agreement.id,
});

export const createAgreementSuspendedByProducerV1Event = (
  agreement: Agreement,
  currentVersion: number,
  correlationId: CorrelationId,
): NewEventStoreAgreementEvent => ({
  correlationId,
  currentMetadataVersion: currentVersion,
  event: {
    data: {
      agreement: toAgreementV1(agreement),
    },
    type: "AgreementSuspendedByProducerV1",
  },
  streamId: agreement.id,
});

export const createAgreementArchivedV1Event = (
  agreement: Agreement,
  currentVersion: number,
  correlationId: CorrelationId,
): NewEventStoreAgreementEvent => ({
  correlationId,
  currentMetadataVersion: currentVersion,
  event: {
    data: {
      agreement: toAgreementV1(agreement),
    },
    type: "AgreementArchivedV1",
  },
  streamId: agreement.id,
});
