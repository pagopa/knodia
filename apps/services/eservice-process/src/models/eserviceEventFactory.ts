import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  CorrelationId,
  EserviceTemplateId,
  EserviceVersionId,
} from "@knodia/common-models/ids";
import type { NewEventStoreEserviceEvent } from "@knodia/db-event-store-writer/eservice";

import { type Eservice, toEserviceV1 } from "@knodia/eservice-models";

export const createEserviceVersionActivatedV1Event = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  template: ExternalResource<EserviceTemplateId> | undefined,
  correlationId: CorrelationId,
): NewEventStoreEserviceEvent => ({
  correlationId,
  currentMetadataVersion: undefined,
  event: {
    data: {
      eservice: toEserviceV1(eservice),
      eserviceVersionId,
      templateId: template?.id,
      templateKnodeId: template?.knodeId,
    },
    type: "EserviceVersionActivatedV1",
  },
  streamId: eservice.id,
});

export const createEserviceVersionArchivedV1Event = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreEserviceEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      eservice: toEserviceV1(eservice),
      eserviceVersionId,
    },
    type: "EserviceVersionArchivedV1",
  },
  streamId: eservice.id,
});

export const createEserviceVersionReactivatedV1Event = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreEserviceEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      eservice: toEserviceV1(eservice),
      eserviceVersionId,
    },
    type: "EserviceVersionReactivatedV1",
  },
  streamId: eservice.id,
});

export const createEserviceVersionSuspendedV1Event = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreEserviceEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      eservice: toEserviceV1(eservice),
      eserviceVersionId,
    },
    type: "EserviceVersionSuspendedV1",
  },
  streamId: eservice.id,
});

export const createEserviceUpdatedV1Event = (
  eservice: Eservice,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreEserviceEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      eservice: toEserviceV1(eservice),
    },
    type: "EserviceUpdatedV1",
  },
  streamId: eservice.id,
});
