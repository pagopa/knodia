import { deriveEserviceStatus, Eservice } from "@knodia/eservice-models";
import { API_ProducerEservice } from "@knodia/eservice-models/api";

import type { EserviceService } from "../services/eserviceService.ts";

import { API_Eservice } from "./api.ts";

export const toAPI_ProducerEservice = (
  producerEservice: ReturnType<
    EserviceService["getProducerEservices"]
  >["items"][number],
): API_ProducerEservice => ({
  activeAgreements: producerEservice.activeAgreements,
  activePurposes: producerEservice.activePurposes,
  categories: producerEservice.eservice.categories,
  description: producerEservice.eservice.description,
  id: producerEservice.eservice.id,
  mode: producerEservice.eservice.mode,
  name: producerEservice.eservice.name,
  status: deriveEserviceStatus(producerEservice.eservice),
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
