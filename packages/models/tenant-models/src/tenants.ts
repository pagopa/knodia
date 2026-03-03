import type { OrganizationId } from "@knodia/common-models/ids";

interface Tenant {
  id: OrganizationId;
  name: string;
}

const tenants: Record<string, string> = {
  "00000000-0000-4000-8000-000000000002": "Local Development Organization",
  "10000000-0000-4000-8000-000000000010": "Comune di Milano",
  "10000000-0000-4000-8000-000000000020": "Regione Lombardia",
  "10000000-0000-4000-8000-000000000030": "PagoPA S.p.A.",
  "20000000-2000-1000-8000-000000000002": "Test Organization",
};

export function getTenant(tenantId: OrganizationId): Tenant | undefined {
  const name = tenants[tenantId];
  if (name === undefined) {
    return undefined;
  }
  return { id: tenantId, name };
}
