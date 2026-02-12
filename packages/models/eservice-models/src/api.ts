import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

import { EserviceVersionState } from "./eservice.ts";

export const API_EserviceVersionState = EserviceVersionState.meta({
  id: "EserviceVersionState",
});
export type API_EserviceVersionState = z.infer<typeof API_EserviceVersionState>;

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
