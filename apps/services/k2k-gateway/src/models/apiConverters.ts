import type { eserviceProcessApi } from "@knodia/eservice-process-client";

import type { API_CatalogEserviceSearchResult } from "./api.ts";

export const toAPI_CatalogEserviceSearchResult = (
  eservice: eserviceProcessApi.Eservice,
  eserviceVersion: eserviceProcessApi.EserviceVersion,
): API_CatalogEserviceSearchResult => ({
  categories: eservice.categories,
  description: eservice.description,
  id: eservice.id,
  latestVersionRequiredAttributes: eserviceVersion.requiredAttributes,
  latestVersionState: eserviceVersion.state,
  mode: eservice.mode,
  name: eservice.name,
  producerId: eservice.producerId,
});
