import type { RequestContextData } from "@fastify/request-context";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { Tenant } from "@knodia/tenant-models";

import type { API_GetTenantsQueryParams } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

export type TenantService = ReturnType<typeof tenantServiceBuilder>;

export function tenantServiceBuilder(readmodelService: ReadmodelService) {
  return {
    async getTenants(
      params: API_GetTenantsQueryParams,
      { logger }: RequestContextData,
    ): Promise<ListResult<Tenant>> {
      logger.info({ params }, "Getting tenants with params");

      return await readmodelService.getTenants(params);
    },
  };
}
