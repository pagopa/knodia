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

const API_RequiredAttributeGroup = z.array(API_EserviceAttribute).meta({
  description:
    "Describes a group of required Attributes (consumers must possess at least one Attribute among them in order to satisfy the requirement)",
  id: "RequiredAttributeGroup",
});

const API_RequiredAttributes = z.array(API_RequiredAttributeGroup).meta({
  description:
    "Describes the Attributes which a consumer must possess to request an Agreement for the E-Service (at least one Attribute for each Attribute Group)",
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
export type API_CatalogEserviceSearchResults = z.infer<
  typeof API_CatalogEserviceSearchResults
>;

export const API_GetCatalogEservicesQueryParams = API_PaginationQueryParams;
export type API_GetCatalogEservicesQueryParams = z.infer<
  typeof API_GetCatalogEservicesQueryParams
>;
