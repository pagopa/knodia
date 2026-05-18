import type { Agreement } from "@knodia/agreement-models";
import type { KnodeId } from "@knodia/common-models/ids";

import type { API_Agreement, API_AgreementActivationClaims } from "./api.ts";

export const toAPI_Agreement = (agreement: Agreement): API_Agreement => ({
  attributes: agreement.attributes,
  consumer: agreement.consumer,
  createdAt: agreement.createdAt.toISOString(),
  eserviceId: agreement.eserviceId,
  eserviceVersionId: agreement.eserviceVersionId,
  id: agreement.id,
  producerId: agreement.producerId,
  state: agreement.state,
  suspendedByConsumerAt: agreement.suspendedByConsumerAt?.toISOString() ?? null,
  suspendedByProducerAt: agreement.suspendedByProducerAt?.toISOString() ?? null,
  updatedAt: agreement.updatedAt.toISOString(),
});

export const toAPI_AgreementActivationClaims = (
  agreement: Agreement,
  thisKnodeId: KnodeId,
): API_AgreementActivationClaims => ({
  agreement: { id: agreement.id, knodeId: thisKnodeId },
  consumer: {
    id: agreement.consumer.id,
    knodeId: agreement.consumer.knodeId,
  },
  eservice: {
    id: agreement.eserviceId,
    knodeId: thisKnodeId,
    version: agreement.eserviceVersionId,
  },
  producer: { id: agreement.producerId, knodeId: thisKnodeId },
});
