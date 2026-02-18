import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { z } from "zod";

const API_EserviceCategory = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .describe(
    "Identifies a category of data, standardized within Knodia, which the E-Service provides or receives",
  )
  .meta({ id: "EserviceCategory" });

const LocalizedText = z.strictObject({
  en: z.string(),
});

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

const API_EserviceVersionState = z
  .enum(["ACTIVE", "SUSPENDED", "ARCHIVED"])
  .meta({ id: "EserviceVersionState" });

const API_EserviceMode = z.enum(["PROVIDE_DATA", "RECEIVE_DATA"]).meta({
  description:
    "Indicates if the E-Service is intended to provide or receive data",
  id: "EserviceMode",
});

const API_Attribute = z
  .strictObject({
    code: z.string().min(1),
    scheme: z.string().min(1),
  })
  .meta({
    description: "Identifies an Attribute standardized within Knodia",
    id: "Attribute",
  });

const API_RequiredAttributeGroup = z.array(API_Attribute).meta({
  description:
    "Described a group of required Attributes (consumers must possess at least one Attribute among them in order to satisfy the requirement)",
  id: "RequiredAttributeGroup",
});

const API_RequiredAttributes = z.array(API_RequiredAttributeGroup).meta({
  description:
    "Describes the Attributes which a consumer must possess to request an Agreement for the E-Service (at least one Attribute for each Attribute Group)",
  id: "RequiredAttributes",
});

const API_EserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: LocalizedText,
    id: z.uuid(),
    latestVersionRequiredAttributes: API_RequiredAttributes,
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
