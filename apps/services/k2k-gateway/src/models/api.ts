import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import {
  API_EserviceCategory,
  API_EserviceMode,
  API_EserviceRequiredAttributes,
  API_EserviceVersionState,
  API_LocalizedDescription,
  API_LocalizedName,
} from "@knodia/eservice-models/api";
import { z } from "zod";

const API_EserviceSearchByKeywords = z.strictObject({
  keywords: z.string().min(1),
});

const API_EserviceSearchByCategory = z.strictObject({
  category: API_EserviceCategory,
});

const API_EserviceSearchByKeywordsAndCategory =
  API_EserviceSearchByKeywords.and(API_EserviceSearchByCategory);

export const API_GetCatalogEserviceSearchParams = z
  .union([
    API_EserviceSearchByKeywords,
    API_EserviceSearchByCategory,
    API_EserviceSearchByKeywordsAndCategory,
  ])
  .meta({ id: "GetCatalogEserviceSearchParams" });

const API_EserviceId = z.uuid().meta({
  description: "Unique identifier of the E-Service",
  id: "EserviceId",
});

const API_OrganizationId = z.uuid().meta({
  description: "Unique identifier of the Organization",
  id: "OrganizationId",
});

export const API_CatalogEserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: API_LocalizedDescription,
    id: API_EserviceId,
    latestVersionRequiredAttributes: API_EserviceRequiredAttributes,
    latestVersionState: API_EserviceVersionState,
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producerId: API_OrganizationId,
  })
  .meta({ id: "CatalogEserviceSearchResult" });
export type API_CatalogEserviceSearchResult = z.infer<
  typeof API_CatalogEserviceSearchResult
>;

export const API_CatalogEserviceSearchResults = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_CatalogEserviceSearchResult),
  })
  .meta({ id: "CatalogEserviceSearchResults" });

export const API_GetCatalogEservicesQueryParams = API_PaginationQueryParams;
