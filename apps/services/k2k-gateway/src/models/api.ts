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
  .meta({
    description:
      "Identifies a category of data, standardized within Knodia, which the E-Service provides or receives",
    id: "EserviceCategory",
  });

const API_LocalizedText = z.strictObject({
  en: z.string(),
});

const API_EserviceSearchByKeywords = z.strictObject({
  keywords: z
    .string()
    .min(1)
    .meta({ description: "Search by name or description" }),
});

const API_EserviceSearchByCategory = z.strictObject({
  category: API_EserviceCategory.meta({
    description: "Include only E-services belonging to the specified category",
  }),
});

const API_EserviceSearchByKeywordsAndCategory = z.strictObject({
  ...API_EserviceSearchByKeywords.shape,
  ...API_EserviceSearchByCategory.shape,
});

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

export const API_EserviceVersionState = z
  .enum(["ACTIVE", "SUSPENDED", "ARCHIVED"])
  .meta({ id: "EserviceVersionState" });
export type API_EserviceVersionState = z.infer<typeof API_EserviceVersionState>;

export const API_AccessTokenType = z.enum(["BEARER", "DPOP"]).meta({
  description: "Type of the access token",
  id: "AccessTokenType",
});
export type API_AccessTokenType = z.infer<typeof API_AccessTokenType>;

export const API_EserviceMode = z.enum(["PROVIDE_DATA", "RECEIVE_DATA"]).meta({
  description:
    "Indicates if the E-Service is intended to provide or receive data",
  id: "EserviceMode",
});
export type API_EserviceMode = z.infer<typeof API_EserviceMode>;

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

export const API_CatalogEserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: API_LocalizedText,
    id: API_EserviceId,
    latestVersionRequiredAttributes: API_RequiredAttributes,
    latestVersionState: API_EserviceVersionState,
    mode: API_EserviceMode,
    name: API_LocalizedText,
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

export const API_EserviceIdPathParam = z.strictObject({
  eserviceId: API_EserviceId,
});

export const API_Eservice = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    createdAt: z.iso.datetime(),
    description: API_LocalizedText,
    id: API_EserviceId,
    isConsumerOperatorIdentificationRequired: z.boolean(),
    isSignalHubEnabled: z.boolean(),
    mode: API_EserviceMode,
    name: API_LocalizedText,
    producerId: API_OrganizationId,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Eservice" });

export type API_Eservice = z.infer<typeof API_Eservice>;

export const API_EserviceVersion = z
  .strictObject({
    accessTokenAudience: z.array(z.string()),
    accessTokenDuration: z.number().int().meta({
      description: "Duration of the access token in seconds",
      format: "int32",
    }),
    accessTokenType: API_AccessTokenType,
    createdAt: z.iso.datetime(),
    id: z
      .uuid()
      .meta({ description: "Unique identifier of the E-service version" }),
    maxDailyCallsPerConsumer: z.number().int().meta({ format: "int32" }),
    maxDailyCallsPerKnode: z.number().int().meta({ format: "int32" }),
    requiredAttributes: API_RequiredAttributes,
    state: API_EserviceVersionState,
    updatedAt: z.iso.datetime(),
    versionNumber: z.number().int().meta({ format: "int32" }),
  })
  .meta({ id: "EserviceVersion" });

export type API_EserviceVersion = z.infer<typeof API_EserviceVersion>;

export const API_EserviceVersionInterfaceDocument = z
  .strictObject({
    checksum: z.string(),
    contentType: z.string(),
    createdAt: z.iso.datetime(),
    id: z
      .uuid()
      .meta({ description: "Unique identifier of the interface document" }),
    name: z.string(),
    path: z.string(),
    prettyName: API_LocalizedText,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "EserviceVersionInterfaceDocument" });

export type API_EserviceVersionInterfaceDocument = z.infer<
  typeof API_EserviceVersionInterfaceDocument
>;

export const API_FileDownload = z.string().meta({ format: "binary" });
