import { type PurposeFormSchemaVersion } from "@knodia/purpose-models";

import schema_1_0 from "../schemas/1.0/schema.json" with { type: "json" };
import texts_en_1_0 from "../schemas/1.0/texts.en.json" with { type: "json" };
import uiSchema_1_0 from "../schemas/1.0/ui-schema.json" with { type: "json" };
import uiTexts_en_1_0 from "../schemas/1.0/ui-texts.en.json" with { type: "json" };

export const CURRENT_FORM_SCHEMA_VERSION: PurposeFormSchemaVersion = "1.0";

interface FormSchemaBundle {
  schema: Record<string, unknown>;
  texts: { en: Record<string, string> };
  uiSchema: Record<string, unknown>;
  uiTexts: { en: Record<string, string> };
}

const FORM_SCHEMAS = {
  "1.0": {
    schema: schema_1_0,
    texts: { en: texts_en_1_0 },
    uiSchema: uiSchema_1_0,
    uiTexts: { en: uiTexts_en_1_0 },
  },
} satisfies Record<PurposeFormSchemaVersion, FormSchemaBundle>;

export const getFormSchemas = (
  version: PurposeFormSchemaVersion,
): FormSchemaBundle => FORM_SCHEMAS[version];
