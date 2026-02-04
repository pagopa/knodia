import {
  API_AccessTokenType,
  API_EserviceAttribute,
  API_EserviceCategory,
  API_EserviceMode,
  API_LocalizedDescription,
  API_LocalizedName,
} from "@knodia/eservice-models/api";
import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/fastify-zod-api-commons/models";
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
        "Base64-encoded SHA-256 checksum of the uploaded interface document",
      ),
    content: z.base64().describe("Base64-encoded file content"),
    contentType: z
      .string()
      .describe("MIME type of the uploaded interface document"),
    name: z
      .string()
      .describe("Name of the uploaded interface document, with extension"),
    prettyName: z
      .strictObject({
        en: z.string().describe("English pretty name"),
      })
      .describe("Pretty name for the document in different languages"),
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
      .min(1)
      .max(86400)
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
      .min(1)
      .max(1000000000)
      .describe("Maximum daily calls per consumer")
      .meta({ format: "int32" }),
    maxDailyCallsPerKnode: z
      .number()
      .int()
      .min(1)
      .max(1000000000)
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
