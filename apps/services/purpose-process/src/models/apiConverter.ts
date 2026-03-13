import type { Purpose } from "@knodia/purpose-models";

import type { API_Purpose } from "./api.ts";

export const toAPI_Purpose = (purpose: Purpose): API_Purpose => ({
  createdAt: purpose.createdAt.toISOString(),
  id: purpose.id,
  updatedAt: purpose.updatedAt.toISOString(),
});
