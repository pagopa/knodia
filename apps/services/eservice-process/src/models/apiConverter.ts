import type { API_EserviceStatus } from "@knodia/eservice-models/api";

import { Eservice, EserviceVersionState } from "@knodia/eservice-models";
import { match } from "ts-pattern";

import { API_Eservice } from "./api.ts";

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

export const toEserviceVersionState = (
  status: API_EserviceStatus,
): EserviceVersionState =>
  match(status)
    .with("Available", () => EserviceVersionState.enum.Active)
    .with("Unavailable", () => EserviceVersionState.enum.Suspended)
    .with("Archived", () => EserviceVersionState.enum.Archived)
    .exhaustive();
