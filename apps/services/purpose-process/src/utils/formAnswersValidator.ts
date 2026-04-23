import type {
  PurposeFormAnswers,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";

// Workaround for ajv lacking proper ESM exports with node16 moduleResolution
// https://github.com/ajv-validator/ajv/issues/2047#issuecomment-1307172500
import AjvModule, { type ValidateFunction } from "ajv";
const Ajv = AjvModule.default;

import type { GetFormSchemas } from "../models/formSchemas.ts";

import { formAnswersValidationFailed } from "../models/errors.ts";

type AssertFormAnswersAreValid = (
  formAnswersJson: PurposeFormAnswers,
  formSchemaVersion: PurposeFormSchemaVersion,
) => void;

export function buildFormAnswersValidator(
  getFormSchemas: GetFormSchemas,
): AssertFormAnswersAreValid {
  const ajv = new Ajv({ allErrors: true });
  const compiledSchemas: Record<PurposeFormSchemaVersion, ValidateFunction> = {
    "1.0": ajv.compile(getFormSchemas("1.0").schema),
  };

  return (formAnswersJson, formSchemaVersion) => {
    const validate = compiledSchemas[formSchemaVersion];
    if (!validate(formAnswersJson)) {
      throw formAnswersValidationFailed(validate.errors ?? []);
    }
  };
}
