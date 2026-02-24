import type { bffApi } from "@knodia/bff-client";

import type { SchemeRef } from "../types/schemeRef";

export interface ConsumptionEserviceDetail {
  accessToken: {
    audience: string;
    duration: number;
    type: bffApi.AccessTokenType;
  };
  categories: bffApi.EserviceCategory[];
  description: string;
  hasRequiredAttributes: boolean;
  id: string;
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
