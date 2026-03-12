import type { OrganizationId } from "@knodia/common-models/ids";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { Organization } from "@knodia/organization-models";

import type { API_GetOrganizationsQueryParams } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { retrieveOrganization } from "../utils/readmodelUtils.ts";

export type OrganizationService = ReturnType<typeof organizationServiceBuilder>;

export function organizationServiceBuilder(readmodelService: ReadmodelService) {
  return {
    async getOrganization(
      organizationId: OrganizationId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<Organization> {
      logger.info(`Getting Organization with ID ${organizationId}`);

      return await retrieveOrganization(organizationId, readmodelService);
    },

    async getOrganizations(
      params: API_GetOrganizationsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<Organization>> {
      logger.info({ params }, "Getting organizations with params");

      return await readmodelService.getOrganizations(params);
    },
  };
}
