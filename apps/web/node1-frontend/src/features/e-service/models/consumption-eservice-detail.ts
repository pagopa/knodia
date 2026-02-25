import type { bffApi } from "@knodia/bff-client";
import type { EserviceId } from "@knodia/common-models/ids";

import type { SchemeRef } from "../types/schemeRef";

export interface ConsumptionEserviceDetail {
  accessToken: {
    audience: string;
    // TODO: BFF API returns seconds — convert in the api-converter.
    durationInMinutes: number;
    type: bffApi.AccessTokenType;
  };
  categories: SchemeRef[];
  description: string;
  id: EserviceId;
  identificationRequired: boolean;
  interfaceDocument: {
    checksum: string;
    name: string;
  };
  isSignalHubEnabled: boolean;
  maxDailyCalls: {
    perConsumer: number;
    perKnode: number;
  };
  mode: bffApi.EserviceMode;
  name: string;
  producer: {
    email: string;
    initials: string;
    knodeName: string;
    name: string;
    notes: string;
  };
  // Each inner array is a group of alternatives (OR): the consumer needs at least one.
  // All groups must be satisfied (AND) to meet the requirements.
  requiredAttributes: ConsumptionRequiredAttribute[][];
  state: bffApi.EserviceVersionState;
}

// TODO: Replace with the auto-generated type from bffApi when the BFF endpoint provides per-attribute possession info
type ConsumptionRequiredAttribute = SchemeRef & { possessed: boolean };
