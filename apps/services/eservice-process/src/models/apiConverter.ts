import { deriveEserviceAvailability, Eservice } from "@knodia/eservice-models";

import { API_Eservice, API_ProducerEserviceListItem } from "./api.ts";

export const toAPI_ProducerEserviceListItem = (
  eservice: Eservice,
  counts: { activeAgreements: number; activePurposes: number },
): API_ProducerEserviceListItem => ({
  activeAgreements: counts.activeAgreements,
  activePurposes: counts.activePurposes,
  availability: deriveEserviceAvailability(eservice),
  categories: eservice.categories,
  description: eservice.description,
  id: eservice.id,
  mode: eservice.mode,
  name: eservice.name,
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
