import type { Agreement } from "@knodia/agreement-models";

import type { API_Agreement } from "./api.ts";

export const toAPI_Agreement = (agreement: Agreement): API_Agreement => ({
  consumer: agreement.consumer,
  createdAt: agreement.createdAt.toISOString(),
  eserviceId: agreement.eserviceId,
  eserviceVersionId: agreement.eserviceVersionId,
  id: agreement.id,
  producerId: agreement.producerId,
  requiredAttributes: agreement.requiredAttributes,
  state: agreement.state,
  updatedAt: agreement.updatedAt.toISOString(),
});
