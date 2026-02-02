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
