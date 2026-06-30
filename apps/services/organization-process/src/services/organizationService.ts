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
      const organizationId =
        seed.externalOrganizationId !== undefined
          ? unsafeBrandId<OrganizationId>(seed.externalOrganizationId)
          : generateId<OrganizationId>();

      // Idempotency: when the caller supplies a deterministic id (e.g. signup
      // provisioning), a redelivery resolves to the existing organization
      // instead of creating a duplicate. The readmodel is eventually
      // consistent, so a too-fast redelivery can slip past this lookup; the
      // event store is the hard guard, rejecting a second creation on the same
      // stream (the id is the stream id).
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
