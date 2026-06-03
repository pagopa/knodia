import type { OrganizationEventStoreWriter } from "@knodia/db-event-store-writer/organization";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type {
  ExternalUISessionAuthData,
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { Organization } from "@knodia/organization-models";

import { getAttribute } from "@knodia/attribute-models";
import {
  generateId,
  type KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";

import type {
  API_GetOrganizationsQueryParams,
  API_OrganizationSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { invalidAttribute } from "../models/errors.ts";
import { createOrganizationCreatedV1Event } from "../models/organizationEventFactory.ts";
import { retrieveOrganization } from "../utils/readmodelUtils.ts";
import {
  assertOrganizationNameIsUnique,
  assertTokenOrganizationClaimsMatchPathParam,
} from "../utils/validators.ts";

export type OrganizationService = ReturnType<typeof organizationServiceBuilder>;

export function organizationServiceBuilder(
  eventStoreWriter: OrganizationEventStoreWriter,
  readmodelService: ReadmodelService,
  config: { knodeId: KnodeId },
) {
  return {
    async createOrganization(
      seed: API_OrganizationSeed,
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<Organization> {
      // Idempotency: a repeated request carrying the same externalRequestId
      // returns the organization created by the first one instead of a
      // duplicate. The readmodel is eventually consistent, so a too-fast
      // redelivery can still slip past this lookup; the unique index on
      // external_request_id is the hard guard behind it.
      if (seed.externalRequestId !== undefined) {
        const existing =
          await readmodelService.getOrganizationByExternalRequestId(
            seed.externalRequestId,
          );
        if (existing !== undefined) {
          logger.info(
            `Organization ${existing.data.id} already exists for externalRequestId ${seed.externalRequestId}; returning it`,
          );
          return existing.data;
        }
      }

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
        externalRequestId: seed.externalRequestId,
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
      {
        authData,
        logger,
      }: AuthorizedContext<
        ExternalUISessionAuthData | InternalAuthData | UISessionAuthData
      >,
    ): Promise<Organization> {
      logger.info(`Getting Organization with ID ${organizationId}`);

      if (authData.tokenType === "external-ui-session") {
        assertTokenOrganizationClaimsMatchPathParam(
          authData,
          organizationId,
          config.knodeId,
        );
      }

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
