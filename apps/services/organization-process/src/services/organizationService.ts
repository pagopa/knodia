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
  unsafeBrandId,
} from "@knodia/common-models/ids";

import type {
  API_GetOrganizationsQueryParams,
  API_OrganizationSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  duplicateOrganizationName,
  invalidAttribute,
} from "../models/errors.ts";
import { createOrganizationCreatedV1Event } from "../models/organizationEventFactory.ts";
import { retrieveOrganization } from "../utils/readmodelUtils.ts";
import { assertTokenOrganizationClaimsMatchPathParam } from "../utils/validators.ts";

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
      // Lowercase to match the id lookup (pg uuid, case-insensitive) and the
      // readmodel's canonical lowercase ids.
      const organizationId =
        seed.externalOrganizationId !== undefined
          ? unsafeBrandId<OrganizationId>(
              seed.externalOrganizationId.toLowerCase(),
            )
          : generateId<OrganizationId>();

      // Idempotent on a deterministic id: a redelivery returns the org. Reads
      // are eventually consistent, so this and the name check below can both
      // miss and hit the event store's hard guard — a 500 by design.
      if (seed.externalOrganizationId !== undefined) {
        const existing =
          await readmodelService.getOrganizationById(organizationId);
        if (existing !== undefined) {
          logger.info(
            `Organization ${organizationId} already exists; returning it`,
          );
          return existing.data;
        }
      }

      logger.info(`Creating Organization ${organizationId}`);

      // Attribute validation is relaxed to support per-organization unique
      // attributes (scheme = Knode ID, code = organization name) without
      // introducing an attribute store. Only the instance's own knode is
      // accepted because every organization is always created on its own knode.
      // The code is intentionally not validated against the name (an optional
      // `code === name` tightening is deferred).
      for (const attr of seed.attributes) {
        const isStandardAttribute = getAttribute(attr) !== undefined;
        const isOwnKnodeUniqueAttribute = attr.scheme === config.knodeId;
        if (!isStandardAttribute && !isOwnKnodeUniqueAttribute) {
          throw invalidAttribute(attr.scheme, attr.code);
        }
      }

      // Best-effort (no DB constraint): on a redelivery the first attempt's
      // projection can land between the id lookup and this check, so it finds
      // the org being recreated. Same id -> idempotent, else 409.
      const sameNameOrganization = await readmodelService.getOrganizationByName(
        seed.name,
      );
      if (sameNameOrganization !== undefined) {
        if (sameNameOrganization.data.id === organizationId) {
          logger.info(
            `Organization ${organizationId} already exists (its projection landed after the id lookup); returning it`,
          );
          return sameNameOrganization.data;
        }
        throw duplicateOrganizationName(seed.name);
      }

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
