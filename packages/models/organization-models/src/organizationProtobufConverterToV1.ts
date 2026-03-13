import type { OrganizationV1 } from "./generated/v1/organization.ts";
import type { Organization } from "./organizations.ts";

export const toOrganizationV1 = (
  organization: Organization,
): OrganizationV1 => ({
  ...organization,
  createdAt: organization.createdAt.getTime(),
  updatedAt: organization.updatedAt.getTime(),
});
