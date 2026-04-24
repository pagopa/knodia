import type { Purpose } from "@knodia/purpose-models";

import type { API_Purpose } from "./api.ts";

export const toAPI_Purpose = (purpose: Purpose): API_Purpose => ({
  archivedAt: purpose.archivedAt?.toISOString() ?? null,
  consumer: purpose.consumer,
  createdAt: purpose.createdAt.toISOString(),
  dailyCalls: purpose.dailyCalls,
  description: purpose.description,
  eserviceId: purpose.eserviceId,
  id: purpose.id,
  name: purpose.name,
  state: purpose.state,
  suspendedByConsumerAt: purpose.suspendedByConsumerAt?.toISOString() ?? null,
  suspendedByProducerAt: purpose.suspendedByProducerAt?.toISOString() ?? null,
  updatedAt: purpose.updatedAt.toISOString(),
});
