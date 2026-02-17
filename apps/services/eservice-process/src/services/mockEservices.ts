import type { EserviceVersionState } from "@knodia/eservice-models";

import {
  API_EserviceCategory,
  API_EserviceMode,
} from "@knodia/eservice-models/api";

export const mockEservices: {
  categories: API_EserviceCategory[];
  description: string;
  mode: API_EserviceMode;
  name: string;
  state: EserviceVersionState;
}[] = [
  {
    categories: [{ code: "main-address", scheme: "knodia-categories" }],
    description:
      "Service for requesting and validating company VAT registration status across EU member states",
    mode: "PROVIDE_DATA",
    name: "Requesting company VAT registration status",
    state: "ACTIVE",
  },
  {
    categories: [
      { code: "main-address", scheme: "knodia-categories" },
      { code: "category-2", scheme: "knodia-categories" },
    ],
    description:
      "Service for validating pension contribution history records for citizens",
    mode: "RECEIVE_DATA",
    name: "Validating pension contribution history",
    state: "SUSPENDED",
  },
  {
    categories: [{ code: "main-address", scheme: "knodia-categories" }],
    description:
      "Service for requesting official birth certificate details from civil registries",
    mode: "PROVIDE_DATA",
    name: "Requesting birth certificate details",
    state: "ARCHIVED",
  },
  {
    categories: [{ code: "main-address", scheme: "knodia-categories" }],
    description:
      "Service for retrieving driver licence information and validity status",
    mode: "PROVIDE_DATA",
    name: "Retrieving driver licence information",
    state: "ACTIVE",
  },
  {
    categories: [{ code: "main-address", scheme: "knodia-categories" }],
    description:
      "Service for verifying healthcare insurance entitlement and coverage details",
    mode: "PROVIDE_DATA",
    name: "Verifying healthcare insurance entitlement",
    state: "ARCHIVED",
  },
  {
    categories: [{ code: "tax-records", scheme: "knodia-categories" }],
    description:
      "Service for accessing and verifying individual tax declaration records",
    mode: "PROVIDE_DATA",
    name: "Accessing tax declaration records",
    state: "ACTIVE",
  },
  {
    categories: [{ code: "education", scheme: "knodia-categories" }],
    description:
      "Service for retrieving academic qualification and degree certification data",
    mode: "RECEIVE_DATA",
    name: "Retrieving academic qualifications",
    state: "SUSPENDED",
  },
  {
    categories: [{ code: "main-address", scheme: "knodia-categories" }],
    description:
      "Service for verifying residential address and domicile registration",
    mode: "PROVIDE_DATA",
    name: "Verifying residential address registration",
    state: "ARCHIVED",
  },
  {
    categories: [{ code: "employment", scheme: "knodia-categories" }],
    description:
      "Service for checking current employment status and contract details",
    mode: "PROVIDE_DATA",
    name: "Checking employment status",
    state: "ACTIVE",
  },
  {
    categories: [{ code: "civil-status", scheme: "knodia-categories" }],
    description:
      "Service for retrieving civil status records including marriage and family data",
    mode: "RECEIVE_DATA",
    name: "Retrieving civil status records",
    state: "ACTIVE",
  },
  {
    categories: [{ code: "vehicles", scheme: "knodia-categories" }],
    description:
      "Service for querying vehicle registration and ownership records",
    mode: "PROVIDE_DATA",
    name: "Querying vehicle registration records",
    state: "ACTIVE",
  },
  {
    categories: [{ code: "social-security", scheme: "knodia-categories" }],
    description:
      "Service for validating social security number and benefit eligibility",
    mode: "PROVIDE_DATA",
    name: "Validating social security benefits",
    state: "SUSPENDED",
  },
];
