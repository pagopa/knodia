import { unsafeBrandId } from "@knodia/common-models/ids";

import type { OrganizationV1 } from "./generated/v1/organization.ts";
import type { Organization } from "./organization.ts";

export const fromOrganizationV1 = (input: OrganizationV1): Organization => ({
  ...input,
  createdAt: new Date(input.createdAt),
  id: unsafeBrandId(input.id),
  updatedAt: new Date(input.updatedAt),
});
