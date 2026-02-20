import type { bffApi } from "@knodia/bff-client";

// TODO: Replace this interface with the auto-generated type when the consumption e-service search BFF endpoint is implemented
export interface ConsumptionEserviceSearchResult {
  categories: bffApi.EserviceCategory[];
  description: string;
  hasRequiredAttributes: boolean;
  id: string;
  mode: bffApi.EserviceMode;
  name: string;
  organization: {
    initials: string;
    name: string;
  };
  state: bffApi.EserviceVersionState;
}

const SCHEME = "vc_example_eservice_categories";

const CAT = {
  birthDate: { code: "citizen.identity.birth_date", scheme: SCHEME },
  birthPlace: { code: "citizen.identity.birth_place", scheme: SCHEME },
  companyAddress: {
    code: "organization.private_company.address",
    scheme: SCHEME,
  },
  maritalStatus: { code: "citizen.identity.marital_status", scheme: SCHEME },
  residencePlace: { code: "citizen.residence.residence_place", scheme: SCHEME },
} as const;

const allResults: ConsumptionEserviceSearchResult[] = [
  {
    categories: [CAT.birthPlace, CAT.birthDate],
    description: "Proof of registration of birth or birth certificate.",
    hasRequiredAttributes: true,
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567801",
    mode: "ProvideData",
    name: "Requesting proof of registration of birth",
    organization: { initials: "LX", name: "Ursa" },
    state: "Active",
  },
  {
    categories: [CAT.birthPlace],
    description:
      "Provision of verified personal identity details as recorded in the national register.",
    hasRequiredAttributes: false,
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678902",
    mode: "ProvideData",
    name: "Retrieving personal identification data",
    organization: { initials: "LX", name: "Alpha Lyncis" },
    state: "Active",
  },
  {
    categories: [CAT.birthPlace],
    description:
      "Confirmation of birth record details as registered in the civil registry.",
    hasRequiredAttributes: true,
    id: "c3d4e5f6-a7b8-9012-cdef-123456789003",
    mode: "ProvideData",
    name: "Requesting birth certificate details",
    organization: { initials: "LX", name: "Ursa" },
    state: "Suspended",
  },
  {
    categories: [CAT.residencePlace],
    description:
      "Verification of residence address registered in the municipal records.",
    hasRequiredAttributes: true,
    id: "d4e5f6a7-b8c9-0123-defa-234567890104",
    mode: "ReceiveData",
    name: "Verifying residence registration",
    organization: { initials: "PL", name: "Polaris" },
    state: "Active",
  },
  {
    categories: [CAT.maritalStatus, CAT.birthDate],
    description:
      "Official marriage certificate from the civil registry office.",
    hasRequiredAttributes: false,
    id: "e5f6a7b8-c9d0-1234-efab-345678901205",
    mode: "ProvideData",
    name: "Requesting marriage certificate",
    organization: { initials: "VG", name: "Vega" },
    state: "Active",
  },
  {
    categories: [CAT.companyAddress],
    description:
      "Provision of verified tax identification number for cross-border tax purposes.",
    hasRequiredAttributes: true,
    id: "f6a7b8c9-d0e1-2345-fabc-456789012306",
    mode: "ProvideData",
    name: "Requesting tax identification number",
    organization: { initials: "SR", name: "Sirius" },
    state: "Active",
  },
  {
    categories: [CAT.birthDate, CAT.companyAddress],
    description:
      "Verification of educational degrees and professional qualifications.",
    hasRequiredAttributes: true,
    id: "a7b8c9d0-e1f2-3456-abcd-567890123407",
    mode: "ReceiveData",
    name: "Verifying educational qualifications",
    organization: { initials: "RG", name: "Rigel" },
    state: "Suspended",
  },
  {
    categories: [CAT.residencePlace],
    description:
      "Provision of criminal record information for employment or residency purposes.",
    hasRequiredAttributes: false,
    id: "b8c9d0e1-f2a3-4567-bcde-678901234508",
    mode: "ProvideData",
    name: "Requesting criminal record certificate",
    organization: { initials: "LX", name: "Alpha Lyncis" },
    state: "Active",
  },
  {
    categories: [CAT.companyAddress],
    description:
      "Cross-border retrieval of social security contribution records.",
    hasRequiredAttributes: true,
    id: "c9d0e1f2-a3b4-5678-cdef-789012345609",
    mode: "ProvideData",
    name: "Retrieving social security data",
    organization: { initials: "PL", name: "Polaris" },
    state: "Active",
  },
  {
    categories: [CAT.birthPlace, CAT.residencePlace],
    description:
      "Official proof of current address from the local municipality records.",
    hasRequiredAttributes: true,
    id: "d0e1f2a3-b4c5-6789-defa-890123456710",
    mode: "ProvideData",
    name: "Requesting proof of address",
    organization: { initials: "VG", name: "Vega" },
    state: "Active",
  },
  {
    categories: [CAT.companyAddress],
    description: "Verification of driving licence status across EU countries.",
    hasRequiredAttributes: false,
    id: "e1f2a3b4-c5d6-7890-efab-901234567811",
    mode: "ReceiveData",
    name: "Verifying driving licence validity",
    organization: { initials: "LX", name: "Ursa" },
    state: "Active",
  },
  {
    categories: [CAT.maritalStatus, CAT.companyAddress],
    description:
      "Official certification of disability status for cross-border benefits.",
    hasRequiredAttributes: true,
    id: "f2a3b4c5-d6e7-8901-fabc-012345678912",
    mode: "ProvideData",
    name: "Requesting disability status certification",
    organization: { initials: "SR", name: "Sirius" },
    state: "Suspended",
  },
];

const MOCK_LIMIT = 3;

export function searchConsumptionEservices({
  category,
  keywords,
  offset,
}: {
  category: string;
  keywords: string;
  offset: number;
}): {
  items: ConsumptionEserviceSearchResult[];
  pagination: { limit: number; offset: number; total: number };
} {
  let filtered = allResults;

  if (category) {
    // category from search params is a composite key "scheme$code"
    const categoryCode = category.split("$")[1] ?? category;
    filtered = filtered.filter((e) =>
      e.categories.some((c) => c.code === categoryCode),
    );
  }

  if (keywords) {
    const kw = keywords.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(kw) ||
        e.description.toLowerCase().includes(kw),
    );
  }

  const total = filtered.length;
  const items = filtered.slice(offset, offset + MOCK_LIMIT);

  return {
    items,
    pagination: { limit: MOCK_LIMIT, offset, total },
  };
}
