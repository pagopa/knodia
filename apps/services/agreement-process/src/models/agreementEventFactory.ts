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
