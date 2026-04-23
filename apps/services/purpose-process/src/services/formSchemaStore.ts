import type { FileManager } from "@knodia/file-manager";

import { genericInternalError } from "@knodia/common-models/errors";
import {
  type PurposeFormAnswers,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";
import AjvModule from "ajv";
const Ajv = AjvModule.default;

import { formAnswersValidationFailed } from "../models/errors.ts";

export interface FormSchemaBundle {
  schema: Record<string, unknown>;
  texts: { en: Record<string, string> };
  uiSchema: Record<string, unknown>;
  uiTexts: { en: Record<string, string> };
}

export type FormSchemaStore = ReturnType<typeof formSchemaStoreBuilder>;

// Bundles are addressed by version and treated as immutable: a given
// version always resolves to the same content. Ops publish a new version by
// uploading a new `versions/<v>/` folder and overwriting `current.json` —
// they never mutate an existing version in place.
export const BUNDLE_FILES = {
  schema: "schema.json",
  texts: "texts.en.json",
  uiSchema: "ui-schema.json",
  uiTexts: "ui-texts.en.json",
} as const;

export const CURRENT_POINTER_FILE = "current.json";

const bundleKey = (version: PurposeFormSchemaVersion, file: string) =>
  `versions/${version}/${file}`;

export function formSchemaStoreBuilder({
  bucket,
  fileManager,
}: {
  bucket: string;
  fileManager: FileManager;
}) {
  const readJson = async <T>(key: string): Promise<T> => {
    try {
      const { content } = await fileManager.getBytes({ bucket, key });
      return JSON.parse(content.toString("utf-8")) as T;
    } catch (err) {
      throw genericInternalError(
        `Failed to read form schema object (bucket=${bucket} key=${key}): ${
          err instanceof Error ? `${err.name}: ${err.message}` : String(err)
        }`,
      );
    }
  };

  const loadBundle = async (
    version: PurposeFormSchemaVersion,
  ): Promise<FormSchemaBundle> => {
    const [schema, uiSchema, textsEn, uiTextsEn] = await Promise.all([
      readJson<Record<string, unknown>>(
        bundleKey(version, BUNDLE_FILES.schema),
      ),
      readJson<Record<string, unknown>>(
        bundleKey(version, BUNDLE_FILES.uiSchema),
      ),
      readJson<Record<string, string>>(bundleKey(version, BUNDLE_FILES.texts)),
      readJson<Record<string, string>>(
        bundleKey(version, BUNDLE_FILES.uiTexts),
      ),
    ]);
    return {
      schema,
      texts: { en: textsEn },
      uiSchema,
      uiTexts: { en: uiTextsEn },
    };
  };

  const readCurrentVersion = async (): Promise<PurposeFormSchemaVersion> => {
    const pointer = await readJson<{ version: unknown }>(CURRENT_POINTER_FILE);
    return PurposeFormSchemaVersion.parse(pointer.version);
  };

  return {
    async getCurrentFormSchemas(): Promise<
      FormSchemaBundle & { version: PurposeFormSchemaVersion }
    > {
      const version = await readCurrentVersion();
      const bundle = await loadBundle(version);
      return { ...bundle, version };
    },
    async getFormSchemas(
      version: PurposeFormSchemaVersion,
    ): Promise<FormSchemaBundle> {
      return await loadBundle(version);
    },
    async validateFormAnswers(
      formAnswersJson: PurposeFormAnswers,
      version: PurposeFormSchemaVersion,
    ): Promise<void> {
      const { schema } = await loadBundle(version);
      const validate = new Ajv({ allErrors: true }).compile(schema);
      if (!validate(formAnswersJson)) {
        throw formAnswersValidationFailed(validate.errors ?? []);
      }
    },
  };
}
