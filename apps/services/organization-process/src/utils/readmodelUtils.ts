import type { OrganizationId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import { organizationNotFound } from "../models/errors.ts";

export const retrieveOrganization = async (
  organizationId: OrganizationId,
  readmodelService: ReadmodelService,
) => {
  const organization =
    await readmodelService.getOrganizationById(organizationId);

  if (!organization) {
    throw organizationNotFound(organizationId);
  }

  return organization.data;
};
