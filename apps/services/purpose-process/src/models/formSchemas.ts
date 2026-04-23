import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { type PurposeFormSchemaVersion } from "@knodia/purpose-models";

export const CURRENT_FORM_SCHEMA_VERSION: PurposeFormSchemaVersion = "1.0";

interface FormSchemaBundle {
  schema: Record<string, unknown>;
  texts: { en: Record<string, string> };
  uiSchema: Record<string, unknown>;
  uiTexts: { en: Record<string, string> };
}

const SCHEMAS_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  process.env["PURPOSE_FORMS_DIR"] ?? "schemas-orion",
);

const readJson = (version: PurposeFormSchemaVersion, file: string): unknown =>
  JSON.parse(readFileSync(join(SCHEMAS_DIR, version, file), "utf8"));

const loadBundle = (version: PurposeFormSchemaVersion): FormSchemaBundle => ({
  schema: readJson(version, "schema.json") as Record<string, unknown>,
  texts: { en: readJson(version, "texts.en.json") as Record<string, string> },
  uiSchema: readJson(version, "ui-schema.json") as Record<string, unknown>,
  uiTexts: {
    en: readJson(version, "ui-texts.en.json") as Record<string, string>,
  },
});

const FORM_SCHEMAS = {
  "1.0": loadBundle("1.0"),
} satisfies Record<PurposeFormSchemaVersion, FormSchemaBundle>;

export const getFormSchemas = (
  version: PurposeFormSchemaVersion,
): FormSchemaBundle => FORM_SCHEMAS[version];
