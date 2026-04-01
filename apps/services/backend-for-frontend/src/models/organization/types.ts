import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { organizationProcessApi } from "@knodia/organization-process-client";

export type OrganizationWithKnode = organizationProcessApi.Organization & {
  knodeId: API_KnodeId;
};
