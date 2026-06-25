import { API_Attribute } from "@knodia/attribute-models/api";
import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { EserviceInterfaceId, OrganizationId } from "@knodia/common-models/ids";
import {
  maxAccessTokenDuration,
  maxDailyCalls,
  minAccessTokenDuration,
  minDailyCalls,
} from "@knodia/eservice-models";
import {
  API_AccessTokenType,
  API_EserviceCategory,
  API_EserviceMode,
  API_EserviceTemplateId,
  API_EserviceTemplateReference,
  API_EserviceVersionState,
  API_LocalizedDescription,
  API_LocalizedInterfacePrettyName,
  API_LocalizedName,
} from "@knodia/eservice-models/api";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import {
  API_PurposeFormAnswers,
  API_PurposeFormSchemaVersion,
} from "@knodia/purpose-models/api";
import { z } from "zod";

export const API_GetEservicesQueryParams = API_PaginationQueryParams.extend({
  eserviceId: arrayQueryParam(z.uuid()).optional().meta({
    description: "Filter by E-service ID",
  }),
  mode: API_EserviceMode.optional().meta({
    description: "Filter by E-service data mode",
  }),
  producerId: OrganizationId.optional().meta({
    description: "Filter by producer organization ID",
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
export type API_GetEservicesQueryParams = z.infer<
  typeof API_GetEservicesQueryParams
>;

export const API_EserviceVersionInterfaceDocument = z
  .strictObject({
    checksum: z
      .string()
      .meta({ description: "SHA-256 checksum of the interface document" }),
    contentType: z
      .string()
      .meta({ description: "MIME type of the interface document" }),
    createdAt: z.iso.datetime(),
    id: EserviceInterfaceId.meta({
      description: "Unique identifier of the interface document",
    }),
    name: z
      .string()
      .meta({ description: "Name of the interface document, with extension" }),
    path: z.string().meta({
      description: "Path where the interface document is stored in the bucket",
    }),
    prettyName: API_LocalizedInterfacePrettyName,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "EserviceVersionInterfaceDocument" });
export type API_EserviceVersionInterfaceDocument = z.infer<
  typeof API_EserviceVersionInterfaceDocument
>;

export const API_PurposeFormOption = z
  .strictObject({
    description: API_LocalizedDescription,
    formAnswersJson: API_PurposeFormAnswers,
    formSchemaVersion: API_PurposeFormSchemaVersion,
    id: z.uuid(),
    name: API_LocalizedName,
  })
  .meta({ id: "PurposeFormOption" });
export type API_PurposeFormOption = z.infer<typeof API_PurposeFormOption>;

export const API_PurposeFormOptions = z
  .strictObject({
    items: z.array(API_PurposeFormOption),
  })
  .meta({ id: "PurposeFormOptions" });
export type API_PurposeFormOptions = z.infer<typeof API_PurposeFormOptions>;

export const API_EserviceVersion = z
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
      .meta({ description: "Maximum daily calls per Knode", format: "int32" }),
    requiredAttributes: z
      .array(z.array(API_Attribute))
      .meta({ description: "Required attributes for the E-service" }),
    state: API_EserviceVersionState.meta({
      description: "State of the version",
    }),
    updatedAt: z.iso.datetime(),
    versionNumber: z
      .number()
      .int()
      .min(1)
      .meta({ description: "Version number", format: "int32" }),
  })
  .meta({ id: "EserviceVersion" });
export type API_EserviceVersion = z.infer<typeof API_EserviceVersion>;

export const API_Eservice = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    createdAt: z.iso.datetime(),
    description: API_LocalizedDescription,
    id: z.uuid(),
    isConsumerOperatorIdentificationRequired: z.boolean(),
    isSignalHubEnabled: z.boolean(),
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producerId: z.uuid(),
    template: API_EserviceTemplateId.optional(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Eservice" });
export type API_Eservice = z.infer<typeof API_Eservice>;

export const API_Eservices = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_Eservice),
  })
  .meta({ id: "Eservices" });
export type API_Eservices = z.infer<typeof API_Eservices>;

const API_InterfaceDocumentSeed = z
  .strictObject({
    checksum: z.string().meta({
      description:
        "SHA-256 checksum of the uploaded E-service interface document",
    }),
    contentType: z.string().meta({
      description: "MIME type of the uploaded E-service interface document",
    }),
    id: EserviceInterfaceId.meta({
      description: "Unique identifier of the E-service interface document",
    }),
    name: z.string().meta({
      description:
        "Name of the uploaded E-service interface document, with extension",
    }),
    path: z.string().meta({
      description: "Path where the E-service interface document is stored",
    }),
    prettyName: API_LocalizedInterfacePrettyName,
  })
  .meta({ id: "InterfaceDocumentSeed" });

const API_EserviceBaseSeed = z.strictObject({
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
  description: API_LocalizedDescription,
  interfaceDocument: API_InterfaceDocumentSeed.meta({
    description: "Interface document",
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
  name: API_LocalizedName,
});

export const API_EserviceFromScratchSeed = API_EserviceBaseSeed.extend({
  categories: z
    .array(API_EserviceCategory)
    .optional()
    .meta({ description: "Categories of the E-service" }),
  mode: API_EserviceMode.meta({
    description: "Mode of the E-service",
  }).optional(),
  requiredAttributes: z
    .array(z.array(API_Attribute))
    .meta({ description: "Required attributes for the E-service" }),
}).meta({ id: "EserviceFromScratchSeed" });
export type API_EserviceFromScratchSeed = z.infer<
  typeof API_EserviceFromScratchSeed
>;

export const API_EserviceFromTemplateSeed = API_EserviceBaseSeed.extend({
  template: API_EserviceTemplateReference,
}).meta({
  id: "EserviceFromTemplateSeed",
});
export type API_EserviceFromTemplateSeed = z.infer<
  typeof API_EserviceFromTemplateSeed
>;

export const API_EserviceSeed = z
  .union([API_EserviceFromScratchSeed, API_EserviceFromTemplateSeed])
  .meta({ id: "EserviceSeed" });
export type API_EserviceSeed = z.infer<typeof API_EserviceSeed>;

export const API_EservicePatch = z
  .strictObject({
    categories: z
      .array(API_EserviceCategory)
      .optional()
      .meta({ description: "Categories of the E-service" }),
    description: API_LocalizedDescription.optional(),
    name: API_LocalizedName.optional(),
  })
  .meta({ id: "EservicePatch" });
export type API_EservicePatch = z.infer<typeof API_EservicePatch>;

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
export type API_GetCatalogEserviceSearchParams = z.infer<
  typeof API_GetCatalogEserviceSearchParams
>;

export const API_GetCatalogEservicesQueryParams = API_PaginationQueryParams;
export type API_GetCatalogEservicesQueryParams = z.infer<
  typeof API_GetCatalogEservicesQueryParams
>;
