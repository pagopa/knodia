import type { KnodeId } from "@knodia/common-models/ids";
import type { organizationProcessApi } from "@knodia/organization-process-client";

export type OrganizationWithKnode = organizationProcessApi.Organization & {
  knodeId: KnodeId;
};
