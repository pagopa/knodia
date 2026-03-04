import type { RequestContextData } from "@fastify/request-context";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { Organization } from "@knodia/organization-models";

import type { API_GetOrganizationsQueryParams } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

export type OrganizationService = ReturnType<typeof organizationServiceBuilder>;

export function organizationServiceBuilder(readmodelService: ReadmodelService) {
  return {
    async getOrganizations(
      params: API_GetOrganizationsQueryParams,
      { logger }: RequestContextData,
    ): Promise<ListResult<Organization>> {
      logger.info({ params }, "Getting organizations with params");

      return await readmodelService.getOrganizations(params);
    },
  };
}
