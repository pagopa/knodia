import type { bffApi } from "@knodia/bff-client";
import type { EserviceId, EserviceVersionId } from "@knodia/common-models/ids";

export interface ConsumptionEserviceDetail {
  accessToken: {
    audience: string[];
    durationInMinutes: number;
    type: bffApi.AccessTokenType;
  };
  agreement?: bffApi.EserviceAgreementDetail;
  categories: bffApi.EserviceCategory[];
  description: string;
  hasRequiredAttributes: boolean;
  id: EserviceId;
  identificationRequired: boolean;
  interfaceDocument: bffApi.ConsumerEserviceDetailsInterfaceDocument;
  isSignalHubEnabled: boolean;
  latestVersionId: EserviceVersionId;
  maxDailyCalls: bffApi.ConsumerEserviceDetailsMaxDailyCalls;
  mode: bffApi.EserviceMode;
  name: string;
  producer: bffApi.CompactOrganization;
  // Each inner array is a group of alternatives (OR): the consumer needs at least one.
  // All groups must be satisfied (AND) to meet the requirements.
  requiredAttributes: bffApi.ConsumerRequiredAttribute[][];
  state: bffApi.EserviceVersionState;
}
