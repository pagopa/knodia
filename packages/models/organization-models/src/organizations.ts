import type { OrganizationId } from "@knodia/common-models/ids";

interface Organization {
  id: OrganizationId;
  name: string;
}

const organizations: Record<string, string> = {
  "00000000-0000-4000-8000-000000000002": "Local Development Organization",
  "10000000-0000-4000-8000-000000000010": "Comune di Milano",
  "10000000-0000-4000-8000-000000000020": "Regione Lombardia",
  "10000000-0000-4000-8000-000000000030": "PagoPA S.p.A.",
  "20000000-2000-1000-8000-000000000002": "Test Organization",
};

// This is a mock function to simulate fetching organization data.
// It will be replaced with a real implementation of data fetching from readmodel in the future.
export function getOrganization(
  organizationId: OrganizationId,
): Organization | undefined {
  const name = organizations[organizationId];
  if (name === undefined) {
    return undefined;
  }
  return { id: organizationId, name };
}
