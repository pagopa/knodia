import type { EserviceVersionId } from "@knodia/common-models/ids";
import type { NewEventStoreEserviceEvent } from "@knodia/db-event-store-eservice/writer";
import type { Eservice, EserviceEventV1 } from "@knodia/eservice-models";

import { toEserviceV1 } from "@knodia/eservice-models";

export const createEserviceVersionActivatedV1Event = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  correlationId: string,
): NewEventStoreEserviceEvent<EserviceEventV1> => ({
  correlationId,
  currentMetadataVersion: null,
  event: {
    data: {
      eservice: toEserviceV1(eservice),
      eserviceVersionId,
    },
    type: "EserviceVersionActivatedV1",
  },
  streamId: eservice.id,
});
