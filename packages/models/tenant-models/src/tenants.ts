import type { OrganizationId } from "@knodia/common-models/ids";

import { unsafeBrandId } from "@knodia/common-models/ids";

interface Tenant {
  id: OrganizationId;
  name: string;
}

const tenants: Record<string, string> = {
  "00000000-0000-4000-8000-000000000002": "Test Municipality",
  "10000000-0000-4000-8000-000000000003": "Revenue Agency - Test",
  "10000000-0000-4000-8000-000000000004": "Social Security - Test",
  "20000000-2000-1000-8000-000000000002": "Test Organization",
};

export function getTenant(id: OrganizationId): Tenant | undefined {
  const name = tenants[id];
  if (name === undefined) {
    return undefined;
  }
  return { id: unsafeBrandId<OrganizationId>(id), name };
}
