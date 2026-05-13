import { PurposeId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

import {
  maxDailyCalls,
  maxDescriptionLength,
  maxNameLength,
  minDailyCalls,
  minDescriptionLength,
  minNameLength,
} from "./purpose.ts";

export const API_PurposeState = z
  .enum(["Active", "Suspended", "Archived"])
  .meta({ id: "PurposeState" });
export type API_PurposeState = z.infer<typeof API_PurposeState>;

export const API_PurposeDailyCalls = z
  .number()
  .int()
  .min(minDailyCalls)
  .max(maxDailyCalls)
  .meta({ format: "int32" });

export const API_PurposeConsumer = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({ id: "PurposeConsumer" });
export type API_PurposeConsumer = z.infer<typeof API_PurposeConsumer>;

export const API_PurposeTemplateReference = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({
    description: "Reference to a Purpose statement template",
    id: "PurposeTemplateReference",
  });
export type API_PurposeTemplateReference = z.infer<
  typeof API_PurposeTemplateReference
>;

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

export const API_PurposeFormSchema = z
  .record(z.string(), z.unknown())
  .meta({ id: "PurposeFormSchema" });
export type API_PurposeFormSchema = z.infer<typeof API_PurposeFormSchema>;

export const API_PurposeFormTexts = z
  .strictObject({
    en: z.record(z.string(), z.string()),
  })
  .meta({ id: "PurposeFormTexts" });
export type API_PurposeFormTexts = z.infer<typeof API_PurposeFormTexts>;

export const API_PurposeFormUiTexts = z
  .strictObject({
    en: z.record(z.string(), z.string()),
  })
  .meta({ id: "PurposeFormUiTexts" });
export type API_PurposeFormUiTexts = z.infer<typeof API_PurposeFormUiTexts>;

export const API_PurposeFormUiSchema = z
  .record(z.string(), z.unknown())
  .meta({ id: "PurposeFormUiSchema" });
export type API_PurposeFormUiSchema = z.infer<typeof API_PurposeFormUiSchema>;

export const API_PurposeIdPathParam = z.strictObject({
  purposeId: PurposeId,
});
export type API_PurposeIdPathParam = z.infer<typeof API_PurposeIdPathParam>;

// External API types — used by services BFF/RRM where the
// form schema version is an opaque string received from the target Knode,
// rather than the internal enum used by the purpose-process.
export const API_ExternalPurposeFormSchemaVersion = z.string().meta({
  description:
    "Version identifier for the Purpose form schema provided by the target Knode",
});
export type API_ExternalPurposeFormSchemaVersion = z.infer<
  typeof API_ExternalPurposeFormSchemaVersion
>;

export const API_ExternalPurposeFormSchemasResponse = z
  .strictObject({
    schema: z.record(z.string(), z.unknown()),
    texts: API_PurposeFormTexts,
    uiSchema: z.record(z.string(), z.unknown()),
    uiTexts: API_PurposeFormUiTexts,
    version: API_ExternalPurposeFormSchemaVersion,
  })
  .meta({
    description:
      "Current Purpose form schemas (JSON Schema + UI Schema + legal/UI texts) with their version identifier",
    id: "PurposeFormSchemasResponse",
  });
export type API_ExternalPurposeFormSchemasResponse = z.infer<
  typeof API_ExternalPurposeFormSchemasResponse
>;
