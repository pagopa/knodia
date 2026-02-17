import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { LocalizedText } from "@knodia/common-models/localization";
import {
  API_EserviceAttribute,
  API_EserviceCategory,
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import { z } from "zod";

const API_EserviceSearchByKeywords = z.strictObject({
  keywords: z.string().min(1),
});

const API_EserviceSearchByCategory = z.strictObject({
  category: API_EserviceCategory,
});

const API_EserviceSearchByKeywordsAndCategory =
  API_EserviceSearchByKeywords.merge(API_EserviceSearchByCategory);

export const API_EserviceSearchParams = z
  .union([
    API_EserviceSearchByKeywords,
    API_EserviceSearchByCategory,
    API_EserviceSearchByKeywordsAndCategory,
  ])
  .meta({ id: "EserviceSearchParams" });
export type API_EserviceSearchParams = z.infer<typeof API_EserviceSearchParams>;

const API_EserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: LocalizedText,
    id: z.uuid(),
    latestVersionRequiredAttributes: z
      .array(z.array(API_EserviceAttribute))
      .meta({ description: "Required attributes for the E-service" }),
    latestVersionState: API_EserviceVersionState,
    mode: API_EserviceMode,
    name: LocalizedText,
    producerId: z.uuid(),
  })
  .meta({ id: "EserviceSearchResult" });

export const API_EserviceSearchResults = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_EserviceSearchResult),
  })
  .meta({ id: "EserviceSearchResults" });
export type API_EserviceSearchResults = z.infer<
  typeof API_EserviceSearchResults
>;

export const API_SearchEservicesQueryParams = API_PaginationQueryParams;
export type API_SearchEservicesQueryParams = z.infer<
  typeof API_SearchEservicesQueryParams
>;
