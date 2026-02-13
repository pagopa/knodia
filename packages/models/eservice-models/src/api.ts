import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

export const API_LocalizedName = LocalizedText.extend({
  en: z.string().min(5).max(60),
})
  .describe("Name of the E-service")
  .meta({ id: "LocalizedName" });
export type API_LocalizedName = z.infer<typeof API_LocalizedName>;

export const API_LocalizedDescription = LocalizedText.extend({
  en: z.string().min(10).max(250),
})
  .describe("Description of the E-service")
  .meta({ id: "LocalizedDescription" });
export type API_LocalizedDescription = z.infer<typeof API_LocalizedDescription>;

export const API_LocalizedInterfacePrettyName = LocalizedText.extend({
  en: z.string().min(5).max(60),
})
  .describe("Pretty name of the E-service interface document")
  .meta({ id: "LocalizedInterfacePrettyName" });
export type API_LocalizedInterfacePrettyName = z.infer<
  typeof API_LocalizedInterfacePrettyName
>;

export const API_EserviceMode = z
  .enum(["PROVIDE_DATA", "RECEIVE_DATA"])
  .describe("Indicates if the E-Service is intended to provide or receive data")
  .meta({ id: "EserviceMode" });
export type API_EserviceMode = z.infer<typeof API_EserviceMode>;

export const API_EserviceCategory = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .describe(
    "Identifies a category of data, standardized within Knodia, which the E-Service provides or receives",
  )
  .meta({ id: "EserviceCategory" });
export type API_EserviceCategory = z.infer<typeof API_EserviceCategory>;

export const API_AccessTokenType = z
  .enum(["BEARER", "DPOP"])
  .meta({ id: "AccessTokenType" });
export type API_AccessTokenType = z.infer<typeof API_AccessTokenType>;

export const API_EserviceAttribute = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .meta({ id: "EserviceAttribute" });
export type API_EserviceAttribute = z.infer<typeof API_EserviceAttribute>;

export const API_EServiceRequiredAttributeGroup = z
  .array(API_EserviceAttribute)
  .describe(
    "Described a group of required Attributes (consumers must possess at least one Attribute among them in order to satisfy the requirement)",
  )
  .meta({
    id: "EServiceRequiredAttributeGroup",
  });
export type API_EServiceRequiredAttributeGroup = z.infer<
  typeof API_EServiceRequiredAttributeGroup
>;

export const API_EserviceRequiredAttributes = z
  .array(API_EServiceRequiredAttributeGroup)
  .describe(
    "Describes the Attributes which a consumer must possess to request an Agreement for the E-Service (at least one Attribute for each Attribute Group)",
  )
  .meta({
    id: "EserviceRequiredAttributes",
  });
export type API_EserviceRequiredAttributes = z.infer<
  typeof API_EserviceRequiredAttributes
>;

export const API_EserviceVersionState = z
  .enum(["ACTIVE", "SUSPENDED", "ARCHIVED"])
  .meta({ id: "EserviceVersionState" });
export type API_EserviceVersionState = z.infer<typeof API_EserviceVersionState>;
