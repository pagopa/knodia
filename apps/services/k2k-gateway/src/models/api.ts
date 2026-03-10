import {
  API_OrganizationId,
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
  description: "Unique identifier of the E-service",
  id: "EserviceId",
});

export const API_CatalogEserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory).meta({
      description: "Categories of data the E-service provides or receives",
    }),
    description: API_LocalizedText.meta({
      description: "Human-readable description of the E-service",
    }),
    id: API_EserviceId,
    latestVersionRequiredAttributes: API_RequiredAttributes.meta({
      description: "Attributes required by the latest version of the E-service",
    }),
    latestVersionState: API_EserviceVersionState.meta({
      description: "Current state of the latest version of the E-service",
    }),
    mode: API_EserviceMode,
    name: API_LocalizedText.meta({
      description: "Human-readable name of the E-service",
    }),
    producerId: API_OrganizationId,
    updatedAt: z.iso.datetime().meta({
      description: "Last update timestamp of the E-service",
    }),
  })
  .meta({
    id: "CatalogEserviceSearchResult",
  });

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
    categories: z.array(API_EserviceCategory).meta({
      description: "Categories of data the E-service provides or receives",
    }),
    description: API_LocalizedText.meta({
      description: "Human-readable description of the E-service",
    }),
    id: API_EserviceId,
    isConsumerOperatorIdentificationRequired: z.boolean().meta({
      description:
        "Indicates whether a consumer operator must log in to the producer Knode directly to confirm Agreement submission",
    }),
    isSignalHubEnabled: z.boolean().meta({
      description: "Whether the E-service supports Signal Hub notifications",
    }),
    mode: API_EserviceMode,
    name: API_LocalizedText.meta({
      description: "Human-readable name of the E-service",
    }),
    producerId: API_OrganizationId,
    updatedAt: z.iso.datetime().meta({
      description: "Last update timestamp of the E-service",
    }),
  })
  .meta({ id: "Eservice" });

export type API_Eservice = z.infer<typeof API_Eservice>;

export const API_EserviceVersionInterfaceDocument = z
  .strictObject({
    checksum: z.string().meta({
      description: "SHA-256 integrity checksum of the file",
    }),
    contentType: z.string().meta({
      description: "The MIME content type of the file",
    }),
    id: z
      .uuid()
      .meta({ description: "Unique identifier of the Interface Document" }),
    name: z.string().meta({
      description: "The name of the file",
    }),
    prettyName: API_LocalizedText.meta({
      description: "A human-readable name for the file",
    }),
    updatedAt: z.iso.datetime().meta({
      description: "Last update timestamp of the Interface Document",
    }),
  })
  .meta({ id: "EserviceVersionInterfaceDocument" });

export type API_EserviceVersionInterfaceDocument = z.infer<
  typeof API_EserviceVersionInterfaceDocument
>;

export const API_EserviceVersion = z
  .strictObject({
    accessTokenAudience: z.array(z.string()).meta({
      description: "List of audiences for the access token",
    }),
    accessTokenDuration: z.number().int().meta({
      description: "Duration of the access token in seconds",
      format: "int32",
    }),
    accessTokenType: API_AccessTokenType,
    id: z
      .uuid()
      .meta({ description: "Unique identifier of the E-service Version" }),
    interfaceDocument: API_EserviceVersionInterfaceDocument.meta({
      description:
        "Metadata of the Interface Document associated with this Version",
    }),
    maxDailyCallsPerConsumer: z.number().int().meta({
      description:
        "Maximum number of daily calls that this Version can afford per consumer",
      format: "int32",
    }),
    maxDailyCallsPerKnode: z.number().int().meta({
      description:
        "Maximum number of daily calls that this Version can afford per Knode",
      format: "int32",
    }),
    requiredAttributes: API_RequiredAttributes,
    state: API_EserviceVersionState.meta({
      description: "Current state of the Version",
    }),
    updatedAt: z.iso.datetime().meta({
      description: "Last update timestamp of the Version",
    }),
    versionNumber: z.number().int().meta({
      description: "Progressive version number",
      format: "int32",
    }),
  })
  .meta({ id: "EserviceVersion" });

export type API_EserviceVersion = z.infer<typeof API_EserviceVersion>;
