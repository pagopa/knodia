import type { KnodeId } from "@knodia/common-models/ids";
import type { organizationProcessApi } from "@knodia/organization-process-client";

import type { API_Operator, API_SessionOrganization } from "./api.ts";

export const toAPI_SessionOrganization = (
  org: organizationProcessApi.Organization,
  knodeId: KnodeId,
): API_SessionOrganization => ({
  attributes: org.attributes,
  id: org.id,
  knodeId,
  name: org.name,
});

export const toAPI_Operator = (
  operator: organizationProcessApi.Operator,
): API_Operator => ({
  email: operator.email,
  id: operator.id,
  roles: operator.roles,
  username: operator.username,
});
