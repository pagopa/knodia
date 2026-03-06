import type { bffApi } from "@knodia/bff-client";
import type { EserviceId } from "@knodia/common-models/ids";

export interface ConsumptionEserviceSearchResult {
  categories: bffApi.EserviceCategory[];
  description: string;
  hasRequiredAttributes: boolean;
  id: EserviceId;
  mode: bffApi.EserviceMode;
  name: string;
  organization: {
    initials: string;
    name: string;
  };
  state: bffApi.EserviceVersionState;
}
