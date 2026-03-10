import { EserviceId } from "@knodia/common-models/ids";
import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

import {
  maxDescriptionLength,
  maxNameLength,
  minDescriptionLength,
  minNameLength,
} from "./eservice.ts";

export const API_EserviceVersionState = z
  .enum(["Active", "Suspended", "Archived"])
  .meta({ id: "EserviceVersionState" });
export type API_EserviceVersionState = z.infer<typeof API_EserviceVersionState>;

export const API_EserviceIdPathParam = z.strictObject({
  eserviceId: EserviceId,
});
export type API_EserviceIdPathParam = z.infer<typeof API_EserviceIdPathParam>;

export const API_LocalizedName = LocalizedText(
  minNameLength,
  maxNameLength,
).meta({ description: "Name of the E-service", id: "LocalizedName" });
export type API_LocalizedName = z.infer<typeof API_LocalizedName>;

export const API_LocalizedDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
).meta({
  description: "Description of the E-service",
  id: "LocalizedDescription",
});
export type API_LocalizedDescription = z.infer<typeof API_LocalizedDescription>;

export const API_LocalizedInterfacePrettyName = LocalizedText(
  minNameLength,
  maxNameLength,
).meta({
  description: "Pretty name of the E-service interface document",
  id: "LocalizedInterfacePrettyName",
});
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
