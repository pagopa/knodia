import type { eserviceProcessApi } from "@knodia/eservice-process-client";

import type { API_ProducerEservice } from "./api.ts";

export const toAPI_ProducerEservice = (
  eservice: eserviceProcessApi.Eservice,
  activeAgreements: number,
  activePurposes: number,
): API_ProducerEservice => ({
  activeAgreements: activeAgreements,
  activePurposes: activePurposes,
  categories: eservice.categories,
  id: eservice.id,
  mode: eservice.mode,
  name: eservice.name,
  state: eservice.state,
});
