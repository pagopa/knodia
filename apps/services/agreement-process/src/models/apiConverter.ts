import type { Agreement } from "@knodia/agreement-models";

import type { API_Agreement } from "./api.ts";

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
