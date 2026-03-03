import type { Tenant } from "@knodia/tenant-models";

import type { API_Tenant } from "./api.ts";

export const toAPI_Tenant = (tenant: Tenant): API_Tenant => ({
  createdAt: tenant.createdAt.toISOString(),
  id: tenant.id,
  name: tenant.name,
});
