import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { LocalizedDescription, LocalizedName } from "@knodia/eservice-models";
import {
  API_EserviceAttribute,
  API_EserviceCategory,
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import { z } from "zod";

const API_KnodeId = z
  .enum(["ORION", "LYNX"])
  .meta({ description: "Unique Knode identifier", id: "KnodeId" });

const API_EserviceSearchByKeywordsAndCategory = z.strictObject({
  category: API_EserviceCategory,
  keywords: z.string().min(1),
  knodeId: API_KnodeId,
});

const API_EserviceSearchByKeywords =
  API_EserviceSearchByKeywordsAndCategory.pick({
    category: true,
    knodeId: true,
  });

const API_EserviceSearchByCategory =
  API_EserviceSearchByKeywordsAndCategory.pick({
    keywords: true,
    knodeId: true,
  });

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

const API_CatalogEserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: LocalizedDescription,
    id: z.uuid(),
    latestVersionRequiredAttributes: z.array(z.array(API_EserviceAttribute)),
    latestVersionState: API_EserviceVersionState,
    mode: API_EserviceMode,
    name: LocalizedName,
    producerId: z.uuid(),
  })
  .meta({ id: "CatalogEserviceSearchResult" });

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
