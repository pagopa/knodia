import type { OrganizationId } from "@knodia/common-models/ids";
import type { OrganizationEventStoreWriter } from "@knodia/db-event-store-writer/organization";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { Organization } from "@knodia/organization-models";

import { generateId } from "@knodia/common-models/ids";

import type {
  API_GetOrganizationsQueryParams,
  API_OrganizationSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { createOrganizationCreatedV1Event } from "../models/organizationEventFactory.ts";
import { retrieveOrganization } from "../utils/readmodelUtils.ts";

export type OrganizationService = ReturnType<typeof organizationServiceBuilder>;

export function organizationServiceBuilder(
  eventStoreWriter: OrganizationEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
    async createOrganization(
      seed: API_OrganizationSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<Organization> {
      const organizationId = generateId<OrganizationId>();

      logger.info(
        `Creating Organization ${organizationId} by user ${authData.userId}`,
      );

      const now = new Date();

      const organization: Organization = {
        attributes: seed.attributes,
        createdAt: now,
        id: organizationId,
        name: seed.name,
        updatedAt: now,
      };

      await eventStoreWriter.insertEvent(
        createOrganizationCreatedV1Event(organization, correlationId),
      );

      return organization;
    },
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
