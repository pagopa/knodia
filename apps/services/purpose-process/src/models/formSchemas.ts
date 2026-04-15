import { type PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { match } from "ts-pattern";

import schema_1_0 from "../schemas/1.0/schema.json" with { type: "json" };
import texts_en_1_0 from "../schemas/1.0/texts.en.json" with { type: "json" };
import uischema_1_0 from "../schemas/1.0/ui-schema.json" with { type: "json" };

export const CURRENT_FORM_SCHEMA_VERSION: PurposeFormSchemaVersion = "1.0";

export const getFormSchema = (
  version: PurposeFormSchemaVersion,
): Record<string, unknown> =>
  match(version)
    .with("1.0", () => schema_1_0)
    .exhaustive();

export const getFormTexts = (
  version: PurposeFormSchemaVersion,
): { en: Record<string, string> } =>
  match(version)
    .with("1.0", () => ({ en: texts_en_1_0 as Record<string, string> }))
    .exhaustive();

export const getFormUiSchema = (
  version: PurposeFormSchemaVersion,
): Record<string, unknown> =>
  match(version)
    .with("1.0", () => uischema_1_0)
    .exhaustive();
