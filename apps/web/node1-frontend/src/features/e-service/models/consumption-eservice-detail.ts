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
  hasRequiredAttributes: boolean;
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
    initials: string;
    name: string;
  };
  requiredAttributes: SchemeRef[][];
  state: bffApi.EserviceVersionState;
}
