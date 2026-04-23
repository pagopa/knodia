import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { type PurposeFormSchemaVersion } from "@knodia/purpose-models";

export const CURRENT_FORM_SCHEMA_VERSION: PurposeFormSchemaVersion = "1.0";

export interface FormSchemaBundle {
  schema: Record<string, unknown>;
  texts: { en: Record<string, string> };
  uiSchema: Record<string, unknown>;
  uiTexts: { en: Record<string, string> };
}

const readJson = (dir: string, version: string, file: string): unknown =>
  JSON.parse(readFileSync(join(dir, version, file), "utf8"));

const loadBundle = (
  dir: string,
  version: PurposeFormSchemaVersion,
): FormSchemaBundle => ({
  schema: readJson(dir, version, "schema.json") as Record<string, unknown>,
  texts: {
    en: readJson(dir, version, "texts.en.json") as Record<string, string>,
  },
  uiSchema: readJson(dir, version, "ui-schema.json") as Record<
    string,
    unknown
  >,
  uiTexts: {
    en: readJson(dir, version, "ui-texts.en.json") as Record<string, string>,
  },
});

export function loadFormSchemas(purposeFormsDir: string) {
  const schemasDir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    purposeFormsDir,
  );
  const formSchemas = {
    "1.0": loadBundle(schemasDir, "1.0"),
  } satisfies Record<PurposeFormSchemaVersion, FormSchemaBundle>;
  return (version: PurposeFormSchemaVersion): FormSchemaBundle =>
    formSchemas[version];
}

export type GetFormSchemas = ReturnType<typeof loadFormSchemas>;
