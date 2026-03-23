import type { KnodeId } from "@knodia/common-models/ids";
import type { purposeProcessApi } from "@knodia/purpose-process-client";

import type { API_PurposeSeed } from "./api.ts";

export function toProcessAPI_PurposeSeed(
  purposeSeed: API_PurposeSeed,
  callerKnodeId: KnodeId,
): purposeProcessApi.PurposeSeed {
  return {
    consumer: toProcessAPI_PurposeConsumer(
      purposeSeed.consumerId,
      callerKnodeId,
    ),
    dailyCalls: purposeSeed.dailyCalls,
    description: purposeSeed.description,
    eserviceId: purposeSeed.eserviceId,
    formAnswersJson: purposeSeed.formAnswersJson,
    name: purposeSeed.name,
  };
}

function toProcessAPI_PurposeConsumer(
  consumerId: string,
  callerKnodeId: KnodeId,
): purposeProcessApi.PurposeConsumer {
  return {
    id: consumerId,
    knodeId: callerKnodeId,
  };
}
