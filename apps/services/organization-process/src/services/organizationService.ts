import type { OrganizationEventStoreWriter } from "@knodia/db-event-store-writer/organization";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { Organization } from "@knodia/organization-models";

import { getAttribute } from "@knodia/attribute-models";
import { generateId, type OrganizationId } from "@knodia/common-models/ids";

import type {
  API_GetOrganizationsQueryParams,
  API_OrganizationSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { invalidAttribute } from "../models/errors.ts";
import { createOrganizationCreatedV1Event } from "../models/organizationEventFactory.ts";
import { retrieveOrganization } from "../utils/readmodelUtils.ts";
import { assertOrganizationNameIsUnique } from "../utils/validators.ts";

export type OrganizationService = ReturnType<typeof organizationServiceBuilder>;

export function organizationServiceBuilder(
  eventStoreWriter: OrganizationEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
    async createOrganization(
      seed: API_OrganizationSeed,
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<Organization> {
      const organizationId = generateId<OrganizationId>();

      logger.info(`Creating Organization ${organizationId}`);

      for (const attr of seed.attributes) {
        if (getAttribute(attr) === undefined) {
          throw invalidAttribute(attr.scheme, attr.code);
        }
      }

      await assertOrganizationNameIsUnique(seed.name, readmodelService);

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
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<ListResult<Organization>> {
      logger.info({ params }, "Getting Organizations with params");

      return await readmodelService.getOrganizations(params);
    },
  };
}
