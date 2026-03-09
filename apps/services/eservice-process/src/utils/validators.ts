import type { OrganizationId } from "@knodia/common-models/ids";

import { getOrganization } from "@knodia/organization-models";

import { organizationNotFound } from "../models/errors.ts";

export function assertOrganizationExists(organizationId: OrganizationId): void {
  const organization = getOrganization(organizationId);
  if (organization === undefined) {
    throw organizationNotFound(organizationId);
  }
}
