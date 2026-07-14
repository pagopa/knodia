import type { InternalAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { Organization } from "@knodia/organization-models";

import {
  type CorrelationId,
  generateId,
  KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { organizationEventStoreWriterBuilder } from "@knodia/db-event-store-writer/organization";
import {
  createTestLogger,
  getMockOrganization,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { organizationServiceBuilder } from "../src/services/organizationService.ts";
import {
  type ReadmodelService,
  readmodelServiceBuilder,
} from "../src/services/readmodelService.ts";
import {
  eventStoreDb,
  organizationWriterService,
  readmodelDb,
} from "./setup.ts";
import { getAllOrganizationEvents, seedOrganizationEvent } from "./utils.ts";

const ctx: AuthorizedContext<InternalAuthData> = {
  authData: { tokenType: "internal" },
  correlationId: generateId<CorrelationId>(),
  logger: createTestLogger().logger,
};

function buildService(rm: ReadmodelService) {
  return organizationServiceBuilder(
    organizationEventStoreWriterBuilder(eventStoreDb),
    rm,
    { knodeId: KnodeId.enum.Orion },
  );
}

// A readmodel that converges mid-request: on the first dedup miss it upserts
// `org`, landing its projection between the id lookup and the name check.
function racingReadmodelInjecting(org: Organization): ReadmodelService {
  const readmodelService = readmodelServiceBuilder(readmodelDb);
  return {
    ...readmodelService,
    getOrganizationById: async (id: OrganizationId) => {
      const result = await readmodelService.getOrganizationById(id);
      if (result === undefined) {
        await organizationWriterService.upsertOrganization(org, 0);
      }
      return result;
    },
  };
}

// These tests pin the race interleaving at the service level via
// racingReadmodelInjecting (see helper above).
describe("createOrganization — redelivery racing the readmodel projection", () => {
  it("returns the existing organization idempotently when its projection lands between the id dedup and the name check, without emitting a new event", async () => {
    const organizationId = generateId<OrganizationId>();
    const org: Organization = {
      ...getMockOrganization(0),
      id: organizationId,
      name: "Race Org",
    };
    // The creation event exists; the readmodel hasn't converged yet.
    await seedOrganizationEvent(org);

    await expect(
      buildService(racingReadmodelInjecting(org)).createOrganization(
        {
          attributes: [],
          externalOrganizationId: organizationId,
          name: org.name,
        },
        ctx,
      ),
    ).resolves.toMatchObject({ id: organizationId, name: "Race Org" });

    await expect(getAllOrganizationEvents()).resolves.toHaveLength(1);
  });

  it("returns idempotently in the race window even when externalOrganizationId is uppercase (guards agree after normalization)", async () => {
    // Projected org has the canonical lowercase id; the redelivery sends it
    // uppercased and must still self-match.
    const canonicalId = generateId<OrganizationId>();
    const org: Organization = {
      ...getMockOrganization(0),
      id: canonicalId,
      name: "Upper Race Org",
    };
    await seedOrganizationEvent(org);

    await expect(
      buildService(racingReadmodelInjecting(org)).createOrganization(
        {
          attributes: [],
          externalOrganizationId: canonicalId.toUpperCase(),
          name: org.name,
        },
        ctx,
      ),
    ).resolves.toMatchObject({ id: canonicalId, name: "Upper Race Org" });

    await expect(getAllOrganizationEvents()).resolves.toHaveLength(1);
  });

  it("still returns 409 when the name is taken by a different organization", async () => {
    const taken: Organization = {
      ...getMockOrganization(0),
      id: generateId<OrganizationId>(),
      name: "Taken Name",
    };
    await organizationWriterService.upsertOrganization(taken, 0);

    await expect(
      buildService(readmodelServiceBuilder(readmodelDb)).createOrganization(
        {
          attributes: [],
          externalOrganizationId: generateId<OrganizationId>(),
          name: "Taken Name",
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      errors: [{ code: "DUPLICATE_ORGANIZATION_NAME" }],
      status: 409,
    });
  });

  it("returns 409 for a case-variant name collision with a different organization", async () => {
    const taken: Organization = {
      ...getMockOrganization(0),
      id: generateId<OrganizationId>(),
      name: "Taken Name",
    };
    await organizationWriterService.upsertOrganization(taken, 0);

    // Different id, name differing only in case: getOrganizationByName is ILIKE,
    // so this must still collide (409), not slip through as a new organization.
    await expect(
      buildService(readmodelServiceBuilder(readmodelDb)).createOrganization(
        {
          attributes: [],
          externalOrganizationId: generateId<OrganizationId>(),
          name: "TAKEN NAME",
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      errors: [{ code: "DUPLICATE_ORGANIZATION_NAME" }],
      status: 409,
    });
  });
});
