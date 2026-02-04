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

export const API_EserviceMode = z
  .enum(["ProvideData", "ReceiveData"])
  .meta({ id: "EserviceMode" });
export type API_EserviceMode = z.infer<typeof API_EserviceMode>;

export const API_EserviceAvailability = z
  .enum(["Available", "Unavailable"])
  .meta({ id: "EserviceAvailability" });
export type API_EserviceAvailability = z.infer<typeof API_EserviceAvailability>;

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
