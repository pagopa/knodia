import { Eservice } from "@knodia/eservice-models";
import {
  toAPI_EserviceMode,
  toAPI_EserviceVersionState,
} from "@knodia/eservice-models/apiConverters";

import { getLatestVersion } from "../utils/eserviceUtils.ts";
import { API_Eservice } from "./api.ts";

export const toAPI_Eservice = (eservice: Eservice): API_Eservice => ({
  categories: eservice.categories,
  createdAt: eservice.createdAt.toISOString(),
  description: eservice.description,
  id: eservice.id,
  isConsumerOperatorIdentificationRequired:
    eservice.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: eservice.isSignalHubEnabled,
  mode: toAPI_EserviceMode(eservice.mode),
  name: eservice.name,
  producerId: eservice.producerId,
  state: toAPI_EserviceVersionState(getLatestVersion(eservice).state),
  updatedAt: eservice.updatedAt.toISOString(),
});
