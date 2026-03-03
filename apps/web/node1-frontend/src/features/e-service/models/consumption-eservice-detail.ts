import type { bffApi } from "@knodia/bff-client";
import type { EserviceId } from "@knodia/common-models/ids";

export interface ConsumptionEserviceDetail {
  accessToken: {
    audience: string[];
    durationInMinutes: number;
    type: bffApi.AccessTokenType;
  };
  categories: bffApi.EserviceCategory[];
  description: string;
  id: EserviceId;
  identificationRequired: boolean;
  interfaceDocument: bffApi.ConsumerCatalogEserviceDetailInterfaceDocument;
  isSignalHubEnabled: boolean;
  maxDailyCalls: bffApi.ConsumerCatalogEserviceDetailMaxDailyCalls;
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
  requiredAttributes: bffApi.ConsumerRequiredAttribute[][];
  state: bffApi.EserviceVersionState;
}
