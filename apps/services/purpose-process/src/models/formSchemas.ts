import { type PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import z from "zod";

export const PURPOSE_FORM_SCHEMA_FOLDERS = [
  "schemas-orion",
  "schemas-lynx",
] as const;
type PurposeFormSchemaFolder = (typeof PURPOSE_FORM_SCHEMA_FOLDERS)[number];

export const CURRENT_FORM_SCHEMA_VERSION: PurposeFormSchemaVersion = "1.0";

const JsonObject = z.record(z.string(), z.unknown());
const TextsDict = z.record(z.string(), z.string());

interface FormSchemaFiles {
  schema: z.infer<typeof JsonObject>;
  texts: { en: z.infer<typeof TextsDict> };
  uiSchema: z.infer<typeof JsonObject>;
  uiTexts: { en: z.infer<typeof TextsDict> };
}

const readJson = <T>(
  dir: string,
  version: string,
  file: string,
  schema: z.ZodType<T>,
): T =>
  schema.parse(JSON.parse(readFileSync(join(dir, version, file), "utf8")));

const loadFormSchemaFiles = (
  dir: string,
  version: PurposeFormSchemaVersion,
): FormSchemaFiles => ({
  schema: readJson(dir, version, "schema.json", JsonObject),
  texts: { en: readJson(dir, version, "texts.en.json", TextsDict) },
  uiSchema: readJson(dir, version, "ui-schema.json", JsonObject),
  uiTexts: { en: readJson(dir, version, "ui-texts.en.json", TextsDict) },
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
