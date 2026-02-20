import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import {
  API_EserviceAttribute,
  API_EserviceCategory,
  API_EserviceMode,
  API_EserviceVersionState,
  API_LocalizedDescription,
  API_LocalizedName,
} from "@knodia/eservice-models/api";
import { z } from "zod";

const API_KnodeId = z
  .enum(["Orion", "Lynx"])
  .meta({ description: "Unique Knode identifier", id: "KnodeId" });

const API_EserviceSearchByKeywordsAndCategory = z.strictObject({
  category: API_EserviceCategory,
  keywords: z.string().min(1),
  knodeId: API_KnodeId,
});

const API_EserviceSearchByCategory =
  API_EserviceSearchByKeywordsAndCategory.pick({
    category: true,
    knodeId: true,
  }).meta({
    description: "Include only E-services belonging to the specified category",
  });

const API_EserviceSearchByKeywords =
  API_EserviceSearchByKeywordsAndCategory.pick({
    keywords: true,
    knodeId: true,
  }).meta({ description: "Search by name or description" });

export const API_GetCatalogEserviceSearchParams = z
  .union([
    API_EserviceSearchByCategory,
    API_EserviceSearchByKeywords,
    API_EserviceSearchByKeywordsAndCategory,
  ])
  .meta({ id: "GetCatalogEserviceSearchParams" });
export type API_GetCatalogEserviceSearchParams = z.infer<
  typeof API_GetCatalogEserviceSearchParams
>;

export const API_GetEserviceSearchParamsWithoutKnodeId = z.union([
  API_EserviceSearchByCategory.omit({ knodeId: true }),
  API_EserviceSearchByKeywords.omit({ knodeId: true }),
  API_EserviceSearchByKeywordsAndCategory.omit({ knodeId: true }),
]);
export type API_GetEserviceSearchParamsWithoutKnodeId = z.infer<
  typeof API_GetEserviceSearchParamsWithoutKnodeId
>;

export const API_CatalogEserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: API_LocalizedDescription,
    id: z.uuid(),
    latestVersionRequiredAttributes: z.array(z.array(API_EserviceAttribute)),
    latestVersionState: API_EserviceVersionState,
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producerId: z.uuid(),
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
export type API_CatalogEserviceSearchResults = z.infer<
  typeof API_CatalogEserviceSearchResults
>;

export const API_GetCatalogEservicesQueryParams = API_PaginationQueryParams;
export type API_GetCatalogEservicesQueryParams = z.infer<
  typeof API_GetCatalogEservicesQueryParams
>;
