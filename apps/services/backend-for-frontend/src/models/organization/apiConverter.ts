import type { KnodeId } from "@knodia/common-models/ids";
import type { organizationProcessApi } from "@knodia/organization-process-client";

import type { API_SessionOrganization } from "./api.ts";

export const toAPI_SessionOrganization = (
  org: organizationProcessApi.Organization,
  knodeId: KnodeId,
): API_SessionOrganization => ({
  attributes: org.attributes,
  id: org.id,
  knodeId,
  name: org.name,
});
