import type { AttributeId } from "@knodia/attribute-models";
import type { OrganizationId } from "@knodia/common-models/ids";

export interface Organization {
  attributes: AttributeId[];
  id: OrganizationId;
  name: string;
}

const organizations: Record<
  string,
  { attributes: AttributeId[]; name: string }
> = {
  "00000000-0000-4000-8000-000000000002": {
    attributes: [
      { code: "nuts1", scheme: "vc_territorial_units" },
      { code: "nuts2", scheme: "vc_territorial_units" },
      { code: "nuts3", scheme: "vc_territorial_units" },
    ],
    name: "Local Development Organization",
  },
  "10000000-0000-4000-8000-000000000010": {
    attributes: [{ code: "nuts3", scheme: "vc_territorial_units" }],
    name: "Comune di Milano",
  },
  "10000000-0000-4000-8000-000000000020": {
    attributes: [{ code: "nuts2", scheme: "vc_territorial_units" }],
    name: "Regione Lombardia",
  },
  "10000000-0000-4000-8000-000000000030": {
    attributes: [{ code: "nuts1", scheme: "vc_territorial_units" }],
    name: "PagoPA S.p.A.",
  },
  "20000000-2000-1000-8000-000000000002": {
    attributes: [],
    name: "Test Organization",
  },
};

// This is a mock function to simulate fetching organization data.
// It will be replaced with a real implementation of data fetching from readmodel in the future.
export function getOrganization(
  organizationId: OrganizationId,
): Organization | undefined {
  const org = organizations[organizationId];
  if (org === undefined) {
    return undefined;
  }
  return { id: organizationId, ...org };
}
