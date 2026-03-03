import {
  API_KnodeId,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import {
  maxAccessTokenDuration,
  maxDailyCalls,
  minAccessTokenDuration,
  minDailyCalls,
} from "@knodia/eservice-models";
import {
  API_AccessTokenType,
  API_EserviceAttribute,
  API_EserviceCategory,
  API_EserviceMode,
  API_EserviceVersionState,
  API_LocalizedDescription,
  API_LocalizedInterfacePrettyName,
  API_LocalizedName,
} from "@knodia/eservice-models/api";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import { z } from "zod";

const API_InterfaceDocumentSeed = z
  .strictObject({
    checksum: z.string().meta({
      description:
        "SHA-256 checksum of the uploaded E-service interface document",
    }),
    content: z.base64().meta({
      description: "Base64-encoded file content",
    }),
    contentType: z.string().meta({
      description: "MIME type of the uploaded E-service interface document",
    }),
    name: z.string().meta({
      description:
        "Name of the uploaded E-service interface document, with extension",
    }),
    prettyName: API_LocalizedInterfacePrettyName,
  })
  .meta({ id: "InterfaceDocumentSeed" });

export const API_EserviceSeed = z
  .strictObject({
    accessTokenAudience: z
      .array(z.string())
      .meta({ description: "Audience for the access token" }),
    accessTokenDuration: z
      .number()
      .int()
      .min(minAccessTokenDuration)
      .max(maxAccessTokenDuration)
      .optional()
      .default(3600)
      .meta({
        description: "Duration of the access token in seconds",
        format: "int32",
      }),
    accessTokenType: API_AccessTokenType.optional()
      .default("Bearer")
      .meta({ description: "Type of the access token" }),
    categories: z
      .array(API_EserviceCategory)
      .optional()
      .meta({ description: "Categories of the E-service" }),
    description: API_LocalizedDescription,
    interfaceDocument: API_InterfaceDocumentSeed.meta({
      description: "Interface document for the E-service",
    }),
    isConsumerOperatorIdentificationRequired: z.boolean().optional().meta({
      description: "Whether consumer operator identification is required",
    }),
    isSignalHubEnabled: z
      .boolean()
      .optional()
      .meta({ description: "Whether SignalHub is enabled for the E-service" }),
    maxDailyCallsPerConsumer: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .meta({
        description:
          "Maximum daily calls per consumer (must be less than or equal to maxDailyCallsPerKnode)",
        format: "int32",
      }),
    maxDailyCallsPerKnode: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .meta({
        description:
          "Maximum daily calls per Knode (must be greater than or equal to maxDailyCallsPerConsumer)",
        format: "int32",
      }),
    mode: API_EserviceMode.meta({
      description: "Mode of the E-service",
    }).optional(),
    name: API_LocalizedName,
    requiredAttributes: z
      .array(z.array(API_EserviceAttribute))
      .meta({ description: "Required attributes for the E-service" }),
  })
  .meta({ id: "EserviceSeed" });
export type API_EserviceSeed = z.infer<typeof API_EserviceSeed>;

export const API_CreatedResource = z
  .strictObject({
    id: z.uuid(),
  })
  .meta({ id: "CreatedResource" });
export type API_CreatedResource = z.infer<typeof API_CreatedResource>;

export const API_ProducerEservice = z
  .strictObject({
    activeAgreements: z
      .number()
      .int()
      .min(0)
      .meta({ description: "Number of active agreements", format: "int32" }),
    activePurposes: z
      .number()
      .int()
      .min(0)
      .meta({ description: "Number of active purposes", format: "int32" }),
    categories: z.array(API_EserviceCategory),
    id: z.uuid(),
    mode: API_EserviceMode,
    name: API_LocalizedName,
    state: API_EserviceVersionState,
  })
  .meta({ id: "ProducerEservice" });
export type API_ProducerEservice = z.infer<typeof API_ProducerEservice>;

export const API_ProducerEservicesQueryParams =
  API_PaginationQueryParams.extend({
    mode: API_EserviceMode.optional().meta({
      description: "Filter by E-service data mode",
    }),
    q: z
      .string()
      .optional()
      .meta({ description: "Search by name, description or categories" }),
    sortBy: z
      .enum(["name"])
      .optional()
      .default("name")
      .meta({ description: "Field to sort by" }),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .default("asc")
      .meta({ description: "Sort direction" }),
    state: arrayQueryParam(API_EserviceVersionState)
      .optional()
      .meta({ description: "Filter by E-service state" }),
  });
export type API_ProducerEservicesQueryParams = z.infer<
  typeof API_ProducerEservicesQueryParams
>;

export const API_ProducerEservices = z
  .strictObject({
    items: z.array(API_ProducerEservice),
    pagination: API_Pagination,
  })
  .meta({ id: "ProducerEservices" });
export type API_ProducerEservices = z.infer<typeof API_ProducerEservices>;

const API_ProducerEserviceVersionDetails = z
  .strictObject({
    accessTokenAudience: z
      .array(z.string())
      .meta({ description: "Audience for the access token" }),
    accessTokenDuration: z
      .number()
      .int()
      .min(minAccessTokenDuration)
      .max(maxAccessTokenDuration)
      .meta({
        description: "Duration of the access token in seconds",
        format: "int32",
      }),
    accessTokenType: API_AccessTokenType.meta({
      description: "Type of the access token",
    }),
    createdAt: z.iso.datetime(),
    id: z
      .uuid()
      .meta({ description: "Unique identifier of the E-service version" }),
    interfaceDocument: z
      .strictObject({
        checksum: z.string().meta({
          description: "SHA-256 checksum of the E-service interface document",
        }),
        prettyName: API_LocalizedInterfacePrettyName.meta({
          description: "Localized pretty name of the E-service interface",
        }),
      })
      .meta({ description: "Interface document details" }),
    maxDailyCallsPerConsumer: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .meta({
        description: "Maximum daily calls per consumer",
        format: "int32",
      }),
    maxDailyCallsPerKnode: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .meta({
        description: "Maximum daily calls per Knode",
        format: "int32",
      }),
    requiredAttributes: z
      .array(z.array(API_EserviceAttribute))
      .meta({ description: "Required attributes for the E-service" }),
    state: API_EserviceVersionState.meta({
      description: "State of the version",
    }),
    updatedAt: z.iso.datetime(),
    versionNumber: z.number().int().min(1).meta({
      description: "Version number",
      format: "int32",
    }),
  })
  .meta({ id: "ProducerEserviceVersionDetails" });

const API_ProducerEserviceDetailsCounters = z
  .strictObject({
    active: z
      .number()
      .int()
      .min(0)
      .meta({ description: "Number of active items", format: "int32" }),
    total: z
      .number()
      .int()
      .min(0)
      .meta({ description: "Total number of items", format: "int32" }),
  })
  .meta({ id: "ProducerEserviceDetailsCounters" });

const API_ProducerEserviceDetailsPurposeCounters =
  API_ProducerEserviceDetailsCounters.extend({
    totalApiCallsPerDay: z.number().int().min(0).meta({
      description: "Total API calls per day across all purposes",
      format: "int32",
    }),
  }).meta({ id: "ProducerEserviceDetailsPurposeCounters" });

export const API_ProducerEserviceDetails = z
  .strictObject({
    agreements: API_ProducerEserviceDetailsCounters.meta({
      description: "Agreement counters",
    }),
    categories: z.array(API_EserviceCategory),
    createdAt: z.iso.datetime(),
    description: API_LocalizedDescription,
    id: z.uuid(),
    isConsumerOperatorIdentificationRequired: z.boolean(),
    isSignalHubEnabled: z.boolean(),
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producerId: z.uuid(),
    purposes: API_ProducerEserviceDetailsPurposeCounters.meta({
      description: "Purpose counters",
    }),
    updatedAt: z.iso.datetime(),
    version: API_ProducerEserviceVersionDetails.meta({
      description: "Latest version details",
    }),
  })
  .meta({ id: "ProducerEserviceDetails" });
export type API_ProducerEserviceDetails = z.infer<
  typeof API_ProducerEserviceDetails
>;

const API_EserviceSearchByKeywordsAndCategory = z.strictObject({
  category: API_EserviceCategory,
  keywords: z.string().min(1),
  knodeId: API_KnodeId,
});
const API_EserviceSearchByCategory =
  API_EserviceSearchByKeywordsAndCategory.pick({
    category: true,
    knodeId: true,
  });
const API_EserviceSearchByKeywords =
  API_EserviceSearchByKeywordsAndCategory.pick({
    keywords: true,
    knodeId: true,
  });
export const API_GetConsumerCatalogEserviceSearchParams = z
  .union([
    API_EserviceSearchByCategory,
    API_EserviceSearchByKeywords,
    API_EserviceSearchByKeywordsAndCategory,
  ])
  .meta({ id: "GetConsumerCatalogEserviceSearchParams" });
export type API_GetConsumerCatalogEserviceSearchParams = z.infer<
  typeof API_GetConsumerCatalogEserviceSearchParams
>;

const API_CompactOrganization = z
  .strictObject({
    id: z.uuid(),
    name: API_LocalizedName,
  })
  .meta({
    description: "Organization with only id and name",
    id: "CompactOrganization",
  });

const API_ConsumerCatalogEserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: API_LocalizedDescription,
    hasRequiredAttributes: z.boolean(),
    id: z.uuid(),
    latestVersionState: API_EserviceVersionState,
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producer: API_CompactOrganization,
  })
  .meta({ id: "ConsumerCatalogEserviceSearchResult" });
export type API_ConsumerCatalogEserviceSearchResult = z.infer<
  typeof API_ConsumerCatalogEserviceSearchResult
>;

export const API_ConsumerCatalogEserviceSearchResults = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_ConsumerCatalogEserviceSearchResult),
  })
  .meta({ id: "ConsumerCatalogEserviceSearchResults" });
export type API_ConsumerCatalogEserviceSearchResults = z.infer<
  typeof API_ConsumerCatalogEserviceSearchResults
>;

export const API_GetConsumerCatalogEservicesQueryParams =
  API_PaginationQueryParams;
export type API_GetConsumerCatalogEservicesQueryParams = z.infer<
  typeof API_GetConsumerCatalogEservicesQueryParams
>;

export const API_GetConsumerCatalogEserviceDetailQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetConsumerCatalogEserviceDetailQueryParams = z.infer<
  typeof API_GetConsumerCatalogEserviceDetailQueryParams
>;

const API_ConsumerCatalogEserviceDetailProducer = z
  .strictObject({
    email: z.string(),
    id: z.uuid(),
    knodeName: z.string(),
    name: API_LocalizedName,
    notes: z.string(),
  })
  .meta({ id: "ConsumerCatalogEserviceDetailProducer" });

const API_ConsumerRequiredAttribute = z
  .strictObject({
    code: z.string(),
    possessed: z.boolean(),
    scheme: z.string(),
  })
  .meta({ id: "ConsumerRequiredAttribute" });

export const API_ConsumerCatalogEserviceDetail = z
  .strictObject({
    accessToken: z
      .strictObject({
        audience: z.array(z.string()),
        duration: z.number().int().meta({
          description: "Duration of the access token in seconds",
          format: "int32",
        }),
        type: API_AccessTokenType,
      })
      .meta({ id: "ConsumerCatalogEserviceDetailAccessToken" }),
    categories: z.array(API_EserviceCategory),
    description: API_LocalizedDescription,
    id: z.uuid(),
    identificationRequired: z.boolean(),
    interfaceDocument: z
      .strictObject({
        checksum: z.string(),
        name: z.string(),
      })
      .meta({ id: "ConsumerCatalogEserviceDetailInterfaceDocument" }),
    isSignalHubEnabled: z.boolean(),
    maxDailyCalls: z
      .strictObject({
        perConsumer: z.number().int().meta({ format: "int32" }),
        perKnode: z.number().int().meta({ format: "int32" }),
      })
      .meta({ id: "ConsumerCatalogEserviceDetailMaxDailyCalls" }),
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producer: API_ConsumerCatalogEserviceDetailProducer,
    requiredAttributes: z.array(z.array(API_ConsumerRequiredAttribute)),
    state: API_EserviceVersionState,
  })
  .meta({ id: "ConsumerCatalogEserviceDetail" });
export type API_ConsumerCatalogEserviceDetail = z.infer<
  typeof API_ConsumerCatalogEserviceDetail
>;
