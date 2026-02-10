import { LocalizedText } from "@knodia/common-models/localization";
import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import {
  EserviceVersionState,
  maxDescriptionLength,
  maxNameLength,
  minDescriptionLength,
  minNameLength,
} from "./eservice.ts";

export const API_LocalizedName = LocalizedText(minNameLength, maxNameLength)
  .describe("Name of the E-service")
  .meta({ id: "LocalizedName" });
export type API_LocalizedName = z.infer<typeof API_LocalizedName>;

export const API_LocalizedDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
)
  .describe("Description of the E-service")
  .meta({ id: "LocalizedDescription" });
export type API_LocalizedDescription = z.infer<typeof API_LocalizedDescription>;

export const API_EserviceMode = z
  .enum(["ProvideData", "ReceiveData"])
  .meta({ id: "EserviceMode" });
export type API_EserviceMode = z.infer<typeof API_EserviceMode>;

export const API_EserviceCategory = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .meta({ id: "EserviceCategory" });
export type API_EserviceCategory = z.infer<typeof API_EserviceCategory>;

export const API_AccessTokenType = z
  .enum(["Bearer", "DPoP"])
  .meta({ id: "AccessTokenType" });
export type API_AccessTokenType = z.infer<typeof API_AccessTokenType>;

export const API_EserviceAttribute = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .meta({ id: "EserviceAttribute" });
export type API_EserviceAttribute = z.infer<typeof API_EserviceAttribute>;

export const API_ProducerEservice = z
  .strictObject({
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
    status: EserviceVersionState,
  })
  .meta({ id: "ProducerEservice" });
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
    status: EserviceVersionState.optional().describe(
      "Filter by E-service status",
    ),
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
