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
).meta({ description: "Name of the Purpose", id: "LocalizedPurposeName" });
export type API_LocalizedPurposeName = z.infer<typeof API_LocalizedPurposeName>;

export const API_LocalizedPurposeDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
).meta({
  description: "Description of the Purpose",
  id: "LocalizedPurposeDescription",
});
export type API_LocalizedPurposeDescription = z.infer<
  typeof API_LocalizedPurposeDescription
>;

export const API_PurposeFormAnswers = z
  .record(z.string(), z.unknown())
  .meta({ id: "PurposeFormAnswers" });
export type API_PurposeFormAnswers = z.infer<typeof API_PurposeFormAnswers>;

export const API_PurposeFormSchemaVersion = z
  .enum(["1.0"])
  .meta({ id: "PurposeFormSchemaVersion" });
export type API_PurposeFormSchemaVersion = z.infer<
  typeof API_PurposeFormSchemaVersion
>;

export const API_PurposeFormSchemaVersionPathParam = z.strictObject({
  version: API_PurposeFormSchemaVersion,
});
export type API_PurposeFormSchemaVersionPathParam = z.infer<
  typeof API_PurposeFormSchemaVersionPathParam
>;

export const API_PurposeFormSchema = z
  .record(z.string(), z.unknown())
  .meta({ id: "PurposeFormSchema" });
export type API_PurposeFormSchema = z.infer<typeof API_PurposeFormSchema>;

export const API_PurposeFormUiSchema = z
  .record(z.string(), z.unknown())
  .meta({ id: "PurposeFormUiSchema" });
export type API_PurposeFormUiSchema = z.infer<typeof API_PurposeFormUiSchema>;

export const API_PurposeIdPathParam = z.strictObject({
  purposeId: PurposeId,
});
export type API_PurposeIdPathParam = z.infer<typeof API_PurposeIdPathParam>;
