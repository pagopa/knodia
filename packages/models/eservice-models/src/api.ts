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

const API_EserviceVersionState = z
  .enum(["Active", "Suspended", "Archived"])
  .meta({ id: "EserviceVersionState" });
type API_EserviceVersionState = z.infer<typeof API_EserviceVersionState>;

const API_EserviceInterface = z
  .strictObject({
    checksum: z.string(),
    contentType: z.string(),
    createdAt: z.iso.datetime(),
    id: z.uuid(),
    name: z.string(),
    path: z.string(),
    prettyName: LocalizedText,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "EserviceInterface" });
type API_EserviceInterface = z.infer<typeof API_EserviceInterface>;

export const API_EserviceVersion = z
  .strictObject({
    accessTokenAudience: z.array(z.string()),
    accessTokenDuration: z.number().meta({ format: "int32" }),
    accessTokenType: API_AccessTokenType,
    createdAt: z.iso.datetime(),
    id: z.uuid(),
    interfaceDocument: API_EserviceInterface,
    maxDailyCallsPerConsumer: z.number().meta({ format: "int32" }),
    maxDailyCallsPerKnode: z.number().meta({ format: "int32" }),
    requiredAttributes: z.array(z.array(API_EserviceAttribute)),
    state: API_EserviceVersionState,
    updatedAt: z.iso.datetime(),
    versionNumber: z.number().meta({ format: "int32" }),
  })
  .meta({ id: "EserviceVersion" });
export type API_EserviceVersion = z.infer<typeof API_EserviceVersion>;
