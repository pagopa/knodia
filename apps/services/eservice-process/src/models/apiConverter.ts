import type { Eservice } from "@knodia/eservice-models";

import type { API_Eservice } from "./api.ts";

export const toAPI_Eservice = (eservice: Eservice): API_Eservice => ({
  categories: eservice.categories,
  description: eservice.description,
  id: eservice.id,
  isConsumerOperatorIdentificationRequired:
    eservice.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: eservice.isSignalHubEnabled,
  mode: eservice.mode,
  name: eservice.name,
});
