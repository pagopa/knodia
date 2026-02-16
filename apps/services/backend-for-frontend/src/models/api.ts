import {
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

export const API_EservicesQueryParams = API_PaginationQueryParams; // TODO extend with filters
export type API_EservicesQueryParams = z.infer<typeof API_EservicesQueryParams>;

const API_Eservice = z
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
    state: API_EserviceVersionState.describe("State of the latest version"),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Eservice" });
type API_Eservice = z.infer<typeof API_Eservice>;

export const API_Eservices = z
  .strictObject({
    items: z.array(API_Eservice),
    pagination: API_Pagination,
  })
  .meta({ id: "Eservices" });
export type API_Eservices = z.infer<typeof API_Eservices>;

const API_InterfaceDocumentSeed = z
  .strictObject({
    checksum: z
      .string()
      .describe(
        "Base64-encoded SHA-256 checksum of the uploaded E-service interface document",
      ),
    content: z.base64().describe("Base64-encoded file content"),
    contentType: z
      .string()
      .describe("MIME type of the uploaded E-service interface document"),
    name: z
      .string()
      .describe(
        "Name of the uploaded E-service interface document, with extension",
      ),
    prettyName: API_LocalizedInterfacePrettyName,
  })
  .meta({ id: "InterfaceDocumentSeed" });

export const API_EserviceSeed = z
  .strictObject({
    accessTokenAudience: z
      .array(z.string())
      .describe("Audience for the access token"),
    accessTokenDuration: z
      .number()
      .int()
      .min(minAccessTokenDuration)
      .max(maxAccessTokenDuration)
      .optional()
      .default(3600)
      .describe("Duration of the access token in seconds")
      .meta({ format: "int32" }),
    accessTokenType: API_AccessTokenType.optional()
      .default("Bearer")
      .describe("Type of the access token"),
    categories: z
      .array(API_EserviceCategory)
      .optional()
      .describe("Categories of the E-service"),
    description: API_LocalizedDescription,
    interfaceDocument: API_InterfaceDocumentSeed.describe(
      "Interface document for the E-service",
    ),
    isConsumerOperatorIdentificationRequired: z
      .boolean()
      .optional()
      .describe("Whether consumer operator identification is required"),
    isSignalHubEnabled: z
      .boolean()
      .optional()
      .describe("Whether SignalHub is enabled for the E-service"),
    maxDailyCallsPerConsumer: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .describe("Maximum daily calls per consumer")
      .meta({ format: "int32" }),
    maxDailyCallsPerKnode: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .describe("Maximum daily calls per Knode")
      .meta({ format: "int32" }),
    mode: API_EserviceMode.describe("Mode of the E-service").optional(),
    name: API_LocalizedName,
    requiredAttributes: z
      .array(z.array(API_EserviceAttribute))
      .describe("Required attributes for the E-service"),
  })
  .meta({ id: "EserviceSeed" });
export type API_EserviceSeed = z.infer<typeof API_EserviceSeed>;

export const API_CreatedResource = z
  .strictObject({
    id: z.uuid(),
  })
  .meta({ id: "CreatedResource" });
export type API_CreatedResource = z.infer<typeof API_CreatedResource>;

export const API_ProducerEservice = z.strictObject({
  activeAgreements: z
    .number()
    .int()
    .min(0)
    .describe("Number of active agreements")
    .meta({ format: "int32" }),
  activePurposes: z
    .number()
    .int()
    .min(0)
    .describe("Number of active purposes")
    .meta({ format: "int32" }),
  categories: z.array(API_EserviceCategory),
  id: z.uuid(),
  mode: API_EserviceMode,
  name: API_LocalizedName,
  state: API_EserviceVersionState,
});
export type API_ProducerEservice = z.infer<typeof API_ProducerEservice>;

export const API_ProducerEservicesQueryParams =
  API_PaginationQueryParams.extend({
    mode: API_EserviceMode.optional().describe("Filter by E-service data mode"),
    q: z
      .string()
      .optional()
      .describe("Search by name, description or categories"),
    sortBy: z
      .enum(["name", "activeAgreements", "activePurposes"])
      .optional()
      .default("name")
      .describe("Field to sort by"),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .default("asc")
      .describe("Sort direction"),
    state: arrayQueryParam(API_EserviceVersionState)
      .optional()
      .describe("Filter by E-service state"),
  });
export type API_ProducerEservicesQueryParams = z.infer<
  typeof API_ProducerEservicesQueryParams
>;

export const API_ProducerEservices = z.strictObject({
  items: z.array(API_ProducerEservice),
  pagination: API_Pagination,
});
export type API_ProducerEservices = z.infer<typeof API_ProducerEservices>;

const API_EserviceVersion = z
  .strictObject({
    accessTokenAudience: z
      .array(z.string())
      .describe("Audience for the access token"),
    accessTokenDuration: z
      .number()
      .int()
      .min(minAccessTokenDuration)
      .max(maxAccessTokenDuration)
      .describe("Duration of the access token in seconds")
      .meta({ format: "int32" }),
    accessTokenType: API_AccessTokenType.describe("Type of the access token"),
    createdAt: z.iso.datetime(),
    id: z.uuid().describe("Unique identifier of the E-service version"),
    maxDailyCallsPerConsumer: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .describe("Maximum daily calls per consumer")
      .meta({ format: "int32" }),
    maxDailyCallsPerKnode: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .describe("Maximum daily calls per Knode")
      .meta({ format: "int32" }),
    requiredAttributes: z
      .array(z.array(API_EserviceAttribute))
      .describe("Required attributes for the E-service"),
    state: API_EserviceVersionState.describe("State of the version"),
    updatedAt: z.iso.datetime(),
    versionNumber: z
      .number()
      .int()
      .min(1)
      .describe("Version number")
      .meta({ format: "int32" }),
  })
  .meta({ id: "EserviceVersion" });

const API_EserviceDetailsCounters = z
  .strictObject({
    active: z
      .number()
      .int()
      .min(0)
      .describe("Number of active items")
      .meta({ format: "int32" }),
    total: z
      .number()
      .int()
      .min(0)
      .describe("Total number of items")
      .meta({ format: "int32" }),
  })
  .meta({ id: "EserviceDetailsCounters" });

const API_EserviceDetailsPurposeCounters = API_EserviceDetailsCounters.extend({
  totalApiCallsPerDay: z
    .number()
    .int()
    .min(0)
    .describe("Total API calls per day across all purposes")
    .meta({ format: "int32" }),
}).meta({ id: "EserviceDetailsPurposeCounters" });

export const API_EserviceDetails = z
  .strictObject({
    agreements: API_EserviceDetailsCounters.describe("Agreement counters"),
    categories: z.array(API_EserviceCategory),
    createdAt: z.iso.datetime(),
    description: API_LocalizedDescription,
    id: z.uuid(),
    isConsumerOperatorIdentificationRequired: z.boolean(),
    isSignalHubEnabled: z.boolean(),
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producerId: z.uuid(),
    purposes: API_EserviceDetailsPurposeCounters.describe("Purpose counters"),
    state: API_EserviceVersionState.describe("State of the latest version"),
    updatedAt: z.iso.datetime(),
    version: API_EserviceVersion.describe("Latest version details"),
  })
  .meta({ id: "EserviceDetails" });
export type API_EserviceDetails = z.infer<typeof API_EserviceDetails>;
