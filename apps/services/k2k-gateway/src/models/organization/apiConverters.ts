import { organizationProcessApi } from "@knodia/organization-process-client";

import type { API_Organization } from "./api.ts";

export const toAPI_Organization = (
  organization: organizationProcessApi.Organization,
): API_Organization => ({
  attributes: organization.attributes,
  id: organization.id,
  name: organization.name,
});
