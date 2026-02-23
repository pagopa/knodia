import type { bffApi } from "@knodia/bff-client";

export interface ConsumptionEserviceSearchResult {
  categories: bffApi.EserviceCategory[];
  description: string;
  // TODO: use result.hasRequiredAttributes
  hasRequiredAttributes: boolean;
  id: string;
  mode: bffApi.EserviceMode;
  name: string;
  // TODO: resolve producer organization name from producerId (BFF should enrich the response)
  producerId: string;
  state: bffApi.EserviceVersionState;
}
