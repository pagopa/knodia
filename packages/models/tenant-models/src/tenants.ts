interface Tenant {
  id: string;
  name: string;
}

const tenants: Record<string, string> = {
  "00000000-0000-4000-8000-000000000002": "Local Development Organization",
  "10000000-0000-4000-8000-000000000010": "Comune di Roma",
  "10000000-0000-4000-8000-000000000020": "Regione Lombardia",
  "10000000-0000-4000-8000-000000000030": "INPS",
  "20000000-2000-1000-8000-000000000002": "Test Organization",
};

export function getTenant(tenantId: string): Tenant | undefined {
  const name = tenants[tenantId];
  if (name === undefined) {
    return undefined;
  }
  return { id: tenantId, name };
}
