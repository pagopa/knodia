import type { OrganizationId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "./readmodelService.ts";

import { organizationNotFound } from "../models/errors.ts";

export async function assertOrganizationExists(
  organizationId: OrganizationId,
  readmodelService: ReadmodelService,
): Promise<void> {
  const organization =
    await readmodelService.getOrganizationById(organizationId);
  if (organization === undefined) {
    throw organizationNotFound(organizationId);
  }
}
