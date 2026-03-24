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
