import type { bffApi } from "@knodia/bff-client";

export interface ConsumptionEserviceSearchResult {
  categories: bffApi.EserviceCategory[];
  description: string;
  // TODO: use result.hasRequiredAttributes
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
