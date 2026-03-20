import type { OrganizationId } from "@knodia/common-models/ids";
import type { Organization } from "@knodia/organization-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import { organizationNotFound } from "../models/errors.ts";

export async function retrieveOrganization(
  organizationId: OrganizationId,
  readmodelService: ReadmodelService,
): Promise<Organization> {
  const organization =
    await readmodelService.getOrganizationById(organizationId);
  if (organization === undefined) {
    throw organizationNotFound(organizationId);
  }
  return organization.data;
}
