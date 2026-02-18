import type { eserviceProcessApi } from "@knodia/eservice-process-client";

import type { API_EserviceSearchResult } from "./api.ts";

export const toAPI_EserviceSearchResult = (
  eservice: eserviceProcessApi.Eservice,
  eserviceVersion: eserviceProcessApi.EserviceVersion,
): API_EserviceSearchResult => ({
  categories: eservice.categories,
  description: eservice.description,
  id: eservice.id,
  latestVersionRequiredAttributes: eserviceVersion.requiredAttributes,
  latestVersionState: eserviceVersion.state,
  mode: eservice.mode,
  name: eservice.name,
  producerId: eservice.producerId,
});
