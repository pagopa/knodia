import type { API_ProducerEservice } from "@knodia/eservice-models/api";

import { Eservice, EserviceVersionState } from "@knodia/eservice-models";

import { API_Eservice } from "./api.ts";

export const toAPI_ProducerEservice = (
  eservice: Eservice & {
    activeAgreements: number;
    activePurposes: number;
    status: EserviceVersionState;
  },
): API_ProducerEservice => ({
  activeAgreements: eservice.activeAgreements,
  activePurposes: eservice.activePurposes,
  categories: eservice.categories,
  id: eservice.id,
  mode: eservice.mode,
  name: eservice.name,
  status: eservice.status,
});

export const toAPI_Eservice = (eservice: Eservice): API_Eservice => ({
  categories: eservice.categories,
  createdAt: eservice.createdAt.toISOString(),
  description: eservice.description,
  id: eservice.id,
  isConsumerOperatorIdentificationRequired:
    eservice.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: eservice.isSignalHubEnabled,
  mode: eservice.mode,
  name: eservice.name,
  producerId: eservice.producerId,
  updatedAt: eservice.updatedAt.toISOString(),
});
