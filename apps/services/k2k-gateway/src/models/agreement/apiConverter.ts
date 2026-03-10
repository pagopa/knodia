import type { agreementProcessApi } from "@knodia/agreement-process-client";
import type { KnodeId } from "@knodia/common-models/ids";

import type { API_AgreementSeed } from "./api.ts";

export function toProcessAPI_AgreementSeed(
  agreementSeed: API_AgreementSeed,
  callerKnodeId: KnodeId,
): agreementProcessApi.AgreementSeed {
  return {
    consumer: toProcessAPI_AgreementConsumer(
      agreementSeed.consumerId,
      callerKnodeId,
    ),
    eserviceId: agreementSeed.eserviceId,
    eserviceVersionId: agreementSeed.eserviceVersionId,
  };
}

function toProcessAPI_AgreementConsumer(
  consumerId: string,
  callerKnodeId: KnodeId,
): agreementProcessApi.AgreementConsumer {
  return {
    id: consumerId,
    knodeId: callerKnodeId,
  };
}
