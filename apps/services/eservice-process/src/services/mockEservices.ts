import type {
  EserviceCategory,
  EserviceMode,
  EserviceVersionState,
} from "@knodia/eservice-models";

export const mockEservices: {
  categories: EserviceCategory[];
  description: string;
  mode: EserviceMode;
  name: string;
  state: EserviceVersionState;
}[] = [
  {
    categories: [{ code: "main-address", scheme: "knodia-categories" }],
    description:
      "Service for requesting and validating company VAT registration status across EU member states",
    mode: "ProvideData",
    name: "Requesting company VAT registration status",
    state: "Active",
  },
  {
    categories: [
      { code: "main-address", scheme: "knodia-categories" },
      { code: "category-2", scheme: "knodia-categories" },
    ],
    description:
      "Service for validating pension contribution history records for citizens",
    mode: "ReceiveData",
    name: "Validating pension contribution history",
    state: "Suspended",
  },
  {
    categories: [{ code: "main-address", scheme: "knodia-categories" }],
    description:
      "Service for requesting official birth certificate details from civil registries",
    mode: "ProvideData",
    name: "Requesting birth certificate details",
    state: "Archived",
  },
  {
    categories: [{ code: "main-address", scheme: "knodia-categories" }],
    description:
      "Service for retrieving driver licence information and validity status",
    mode: "ProvideData",
    name: "Retrieving driver licence information",
    state: "Active",
  },
  {
    categories: [{ code: "main-address", scheme: "knodia-categories" }],
    description:
      "Service for verifying healthcare insurance entitlement and coverage details",
    mode: "ProvideData",
    name: "Verifying healthcare insurance entitlement",
    state: "Archived",
  },
  {
    categories: [{ code: "tax-records", scheme: "knodia-categories" }],
    description:
      "Service for accessing and verifying individual tax declaration records",
    mode: "ProvideData",
    name: "Accessing tax declaration records",
    state: "Active",
  },
  {
    categories: [{ code: "education", scheme: "knodia-categories" }],
    description:
      "Service for retrieving academic qualification and degree certification data",
    mode: "ReceiveData",
    name: "Retrieving academic qualifications",
    state: "Suspended",
  },
  {
    categories: [{ code: "main-address", scheme: "knodia-categories" }],
    description:
      "Service for verifying residential address and domicile registration",
    mode: "ProvideData",
    name: "Verifying residential address registration",
    state: "Archived",
  },
  {
    categories: [{ code: "employment", scheme: "knodia-categories" }],
    description:
      "Service for checking current employment status and contract details",
    mode: "ProvideData",
    name: "Checking employment status",
    state: "Active",
  },
  {
    categories: [{ code: "civil-status", scheme: "knodia-categories" }],
    description:
      "Service for retrieving civil status records including marriage and family data",
    mode: "ReceiveData",
    name: "Retrieving civil status records",
    state: "Active",
  },
  {
    categories: [{ code: "vehicles", scheme: "knodia-categories" }],
    description:
      "Service for querying vehicle registration and ownership records",
    mode: "ProvideData",
    name: "Querying vehicle registration records",
    state: "Active",
  },
  {
    categories: [{ code: "social-security", scheme: "knodia-categories" }],
    description:
      "Service for validating social security number and benefit eligibility",
    mode: "ProvideData",
    name: "Validating social security benefits",
    state: "Suspended",
  },
];
