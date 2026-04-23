import { type PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PURPOSE_FORM_SCHEMA_FOLDERS = [
  "schemas-orion",
  "schemas-lynx",
] as const;
type PurposeFormSchemaFolder = (typeof PURPOSE_FORM_SCHEMA_FOLDERS)[number];

export const CURRENT_FORM_SCHEMA_VERSION: PurposeFormSchemaVersion = "1.0";

interface FormSchemaFiles {
  schema: Record<string, unknown>;
  texts: { en: Record<string, string> };
  uiSchema: Record<string, unknown>;
  uiTexts: { en: Record<string, string> };
}

const readJson = (dir: string, version: string, file: string): unknown =>
  JSON.parse(readFileSync(join(dir, version, file), "utf8"));

const loadFormSchemaFiles = (
  dir: string,
  version: PurposeFormSchemaVersion,
): FormSchemaFiles => ({
  schema: readJson(dir, version, "schema.json") as Record<string, unknown>,
  texts: {
    en: readJson(dir, version, "texts.en.json") as Record<string, string>,
  },
  uiSchema: readJson(dir, version, "ui-schema.json") as Record<string, unknown>,
  uiTexts: {
    en: readJson(dir, version, "ui-texts.en.json") as Record<string, string>,
  },
});

export type GetFormSchemas = ReturnType<typeof loadFormSchemas>;

export function loadFormSchemas(purposeFormsDir: PurposeFormSchemaFolder) {
  const schemasDir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    purposeFormsDir,
  );
  const formSchemas = {
    "1.0": loadFormSchemaFiles(schemasDir, "1.0"),
  } satisfies Record<PurposeFormSchemaVersion, FormSchemaFiles>;
  return (version: PurposeFormSchemaVersion): FormSchemaFiles =>
    formSchemas[version];
}
