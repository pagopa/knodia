import type {
  PurposeFormAnswers,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";

import Ajv from "ajv/dist/2020";
import { match } from "ts-pattern";

import { formAnswersValidationFailed } from "../models/errors.ts";
import schema_1_0 from "../schemas/1.0/schema.json" with { type: "json" };

const ajv = new Ajv({ allErrors: true });

const compiledSchemas = {
  "1.0": ajv.compile(schema_1_0),
} as const;

const getCompiledSchema = (version: PurposeFormSchemaVersion) =>
  match(version)
    .with("1.0", () => compiledSchemas["1.0"])
    .exhaustive();

export function assertFormAnswersAreValid(
  formAnswersJson: PurposeFormAnswers,
  formSchemaVersion: PurposeFormSchemaVersion,
): void {
  const validate = getCompiledSchema(formSchemaVersion);

  if (!validate(formAnswersJson)) {
    throw formAnswersValidationFailed(validate.errors ?? []);
  }
}
