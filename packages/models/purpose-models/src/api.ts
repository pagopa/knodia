import { PurposeId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

import {
  maxDescriptionLength,
  maxNameLength,
  minDescriptionLength,
  minNameLength,
} from "./purpose.ts";

export const API_PurposeState = z
  .enum(["Active", "Suspended", "Archived"])
  .meta({ id: "PurposeState" });
export type API_PurposeState = z.infer<typeof API_PurposeState>;

export const API_PurposeConsumer = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({ id: "PurposeConsumer" });
export type API_PurposeConsumer = z.infer<typeof API_PurposeConsumer>;

export const API_LocalizedPurposeName = LocalizedText(
  minNameLength,
  maxNameLength,
).meta({ description: "Name of the Purpose", id: "PurposeLocalizedName" });
export type API_LocalizedPurposeName = z.infer<typeof API_LocalizedPurposeName>;

export const API_LocalizedPurposeDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
).meta({
  description: "Description of the Purpose",
  id: "PurposeLocalizedDescription",
});
export type API_LocalizedPurposeDescription = z.infer<
  typeof API_LocalizedPurposeDescription
>;

export const API_PurposeIdPathParam = z.strictObject({
  purposeId: PurposeId,
});
export type API_PurposeIdPathParam = z.infer<typeof API_PurposeIdPathParam>;
