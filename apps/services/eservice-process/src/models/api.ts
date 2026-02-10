import { EserviceInterfaceId, OrganizationId } from "@knodia/common-models/ids";
import { EserviceVersionState } from "@knodia/eservice-models";
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
  API_LocalizedDescription,
  API_LocalizedInterfacePrettyName,
  API_LocalizedName,
} from "@knodia/eservice-models/api";
import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/fastify-zod-api-commons/models";
import { z } from "zod";

export const API_EservicesQueryParams = API_PaginationQueryParams.extend({
  mode: API_EserviceMode.optional().describe("Filter by E-service data mode"),
  producerId: OrganizationId.optional().describe(
    "Filter by producer organization ID",
  ),
  q: z
    .string()
    .optional()
    .describe("Search by name, description or categories"),
  sortBy: z
    .enum(["name"])
    .optional()
    .default("name")
    .describe("Field to sort by"),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("asc")
    .describe("Sort direction"),
  status: z
    .union([
      z.array(EserviceVersionState),
      EserviceVersionState.transform((v) => [v]),
    ])
    .optional()
    .describe("Filter by E-service status"),
});
export type API_EservicesQueryParams = z.infer<typeof API_EservicesQueryParams>;

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
    status: EserviceVersionState.describe("Status of the latest version"),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Eservice" });
export type API_Eservice = z.infer<typeof API_Eservice>;

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
    contentType: z
      .string()
      .describe("MIME type of the uploaded E-service interface document"),
    id: EserviceInterfaceId.describe(
      "Unique identifier of the E-service interface document",
    ),
    name: z
      .string()
      .describe(
        "Name of the uploaded E-service interface document, with extension",
      ),
    path: z
      .string()
      .describe("Path where the E-service interface document is stored"),
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
    interfaceDocument: API_InterfaceDocumentSeed.describe("Interface document"),
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
