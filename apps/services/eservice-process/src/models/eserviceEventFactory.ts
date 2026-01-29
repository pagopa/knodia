import type { EserviceVersionId } from "@knodia/common-models/ids";
import type { NewEventStoreEserviceEvent } from "@knodia/db-event-store-writer/eservice";
import type { Eservice } from "@knodia/eservice-models";

import { toEserviceV1 } from "@knodia/eservice-models";

export const createEserviceVersionActivatedV1Event = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  correlationId: string,
): NewEventStoreEserviceEvent => ({
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
