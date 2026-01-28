import {
  API_LocalizedDescription,
  API_LocalizedName,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/fastify-zod-api-commons/models";
import { z } from "zod";

export const API_EservicesQueryParams = API_PaginationQueryParams; // TODO extend with filters
export type API_EservicesQueryParams = z.infer<typeof API_EservicesQueryParams>;

const API_EserviceMode = z.enum(["ProvideData", "ReceiveData"]);

const API_EserviceCategory = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .meta({ id: "EserviceCategory" });

const API_AccessTokenType = z.enum(["Bearer", "DPoP"]);

const API_EserviceAttribute = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .meta({ id: "EserviceAttribute" });

export const API_Eservice = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    createdAt: z.iso.datetime(),
    description: API_LocalizedDescription,
    id: z.string(),
    isConsumerOperatorIdentificationRequired: z.boolean(),
    isSignalHubEnabled: z.boolean(),
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producerId: z.string(),
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

export const API_EserviceSeed = z
  .strictObject({
    accessTokenAudience: z
      .array(z.string())
      .describe("Audience for the access token"),
    accessTokenDuration: z
      .number()
      .int()
      .min(1)
      .max(1440)
      .optional()
      .default(60)
      .describe("Duration of the access token in minutes")
      .meta({ format: "int32" }),
    accessTokenType: API_AccessTokenType.optional()
      .default("Bearer")
      .describe("Type of the access token"),
    categories: z
      .array(API_EserviceCategory)
      .optional()
      .describe("Categories of the E-service"),
    description: API_LocalizedDescription.describe(
      "Description of the E-service",
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
      .describe("Maximum daily calls per consumer")
      .meta({ format: "int32" }),
    maxDailyCallsPerKnode: z
      .number()
      .int()
      .min(1)
      .describe("Maximum daily calls per Knode")
      .meta({ format: "int32" }),
    mode: API_EserviceMode.describe("Mode of the E-service").optional(),
    name: API_LocalizedName.describe("Name of the E-service"),
    requiredAttributes: z
      .array(z.array(API_EserviceAttribute))
      .describe("Required attributes for the E-service"),
  })
  .meta({ id: "EserviceSeed" });
export type API_EserviceSeed = z.infer<typeof API_EserviceSeed>;
