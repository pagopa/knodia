import type { bffApi } from "@knodia/bff-client";

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
