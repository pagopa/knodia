import type { IdmUser } from "@knodia/idm-client";
import type { Organization } from "@knodia/organization-models";

import type { API_Operator, API_Organization } from "./api.ts";

export const toAPI_Organization = (
  organization: Organization,
): API_Organization => ({
  attributes: organization.attributes,
  createdAt: organization.createdAt.toISOString(),
  id: organization.id,
  name: organization.name,
  updatedAt: organization.updatedAt.toISOString(),
});

export const toAPI_Operator = (user: IdmUser): API_Operator => ({
  email: user.email,
  id: user.id,
  roles: user.roles,
  username: user.username,
});
