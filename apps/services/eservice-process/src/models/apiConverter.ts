import type { API_ProducerEservice } from "@knodia/eservice-models/api";

import { Eservice } from "@knodia/eservice-models";

import type { ProducerEservice } from "./types.ts";

import { API_Eservice } from "./api.ts";

export const toAPI_ProducerEservice = (
  producerEservice: ProducerEservice,
): API_ProducerEservice => ({
  activeAgreements: producerEservice.activeAgreements,
  activePurposes: producerEservice.activePurposes,
  categories: producerEservice.categories,
  id: producerEservice.id,
  mode: producerEservice.mode,
  name: producerEservice.name,
  status: producerEservice.status,
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
  status: getLatestVersion(eservice).state,
  updatedAt: eservice.updatedAt.toISOString(),
});
