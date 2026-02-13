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

export const API_EserviceSearchParams = z
  .union([
    API_EserviceSearchByKeywords,
    API_EserviceSearchByCategory,
    API_EserviceSearchByKeywordsAndCategory,
  ])
  .meta({ id: "EserviceSearchParams" });

export const API_EserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: API_LocalizedDescription,
    id: z.uuid(),
    latestVersionRequiredAttributes: API_EserviceRequiredAttributes,
    latestVersionState: API_EserviceVersionState,
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producerId: z.uuid(),
  })
  .meta({ id: "EserviceSearchResult" });
export type API_EserviceSearchResult = z.infer<typeof API_EserviceSearchResult>;

export const API_EserviceSearchResults = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_EserviceSearchResult),
  })
  .meta({ id: "EserviceSearchResults" });

export const API_SearchEservicesQueryParams = API_PaginationQueryParams;
