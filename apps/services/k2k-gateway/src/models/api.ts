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
  API_EserviceSearchByKeywords.and(API_EserviceSearchByCategory);

export const API_GetCatalogEserviceSearchParams = z
  .union([
    API_EserviceSearchByKeywords,
    API_EserviceSearchByCategory,
    API_EserviceSearchByKeywordsAndCategory,
  ])
  .meta({ id: "GetCatalogEserviceSearchParams" });

type API_GetCatalogEserviceSearchParams = z.infer<
  typeof API_GetCatalogEserviceSearchParams
>;

const API_EserviceVersionState = z
  .enum(["ACTIVE", "SUSPENDED", "ARCHIVED"])
  .meta({ id: "EserviceVersionState" });

const API_EserviceMode = z
  .enum(["PROVIDE_DATA", "RECEIVE_DATA"])
  .describe("Indicates if the E-Service is intended to provide or receive data")
  .meta({ id: "EserviceMode" });

const API_Attribute = z
  .strictObject({
    code: z.string().min(1),
    scheme: z.string().min(1),
  })
  .describe("Identifies an Attribute standardized within Knodia")
  .meta({ id: "Attribute" });

const API_RequiredAttributeGroup = z
  .array(API_Attribute)
  .describe(
    "Described a group of required Attributes (consumers must possess at least one Attribute among them in order to satisfy the requirement)",
  )
  .meta({
    id: "RequiredAttributeGroup",
  });

const API_RequiredAttributes = z
  .array(API_RequiredAttributeGroup)
  .describe(
    "Describes the Attributes which a consumer must possess to request an Agreement for the E-Service (at least one Attribute for each Attribute Group)",
  )
  .meta({
    id: "RequiredAttributes",
  });

const API_EserviceId = z.uuid().meta({
  description: "Unique identifier of the E-Service",
  id: "EserviceId",
});

const API_OrganizationId = z.uuid().meta({
  description: "Unique identifier of the Organization",
  id: "OrganizationId",
});

const API_CatalogEserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: LocalizedText,
    id: API_EserviceId,
    latestVersionRequiredAttributes: API_RequiredAttributes,
    latestVersionState: API_EserviceVersionState,
    mode: API_EserviceMode,
    name: LocalizedText,
    producerId: API_OrganizationId,
  })
  .meta({ id: "CatalogEserviceSearchResult" });

export const API_CatalogEserviceSearchResults = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_CatalogEserviceSearchResult),
  })
  .meta({ id: "CatalogEserviceSearchResults" });

export const API_GetCatalogEservicesQueryParams = API_PaginationQueryParams;
