import type { Organization } from "@knodia/organization-models";

import type { API_Organization } from "./api.ts";

export const toAPI_Organization = (
  organization: Organization,
): API_Organization => ({
  attributes: organization.attributes,
  createdAt: organization.createdAt.toISOString(),
  id: organization.id,
  name: organization.name,
  updatedAt: organization.updatedAt.toISOString(),
});
