import type { Purpose } from "@knodia/purpose-models";

import type { API_Purpose } from "./api.ts";

export const toAPI_Purpose = (purpose: Purpose): API_Purpose => ({
  consumer: purpose.consumer,
  createdAt: purpose.createdAt.toISOString(),
  dailyCalls: purpose.dailyCalls,
  description: purpose.description,
  eserviceId: purpose.eserviceId,
  id: purpose.id,
  name: purpose.name,
  state: purpose.state,
  updatedAt: purpose.updatedAt.toISOString(),
});
