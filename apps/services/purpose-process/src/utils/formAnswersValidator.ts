import type {
  PurposeFormAnswers,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";

import Ajv, { type ValidateFunction } from "ajv/dist/2020";

import { formAnswersValidationFailed } from "../models/errors.ts";
import { getFormSchema } from "../models/formSchemas.ts";

const ajv = new Ajv({ allErrors: true });

const compiledSchemas: Record<PurposeFormSchemaVersion, ValidateFunction> = {
  "1.0": ajv.compile(getFormSchema("1.0")),
};

export function assertFormAnswersAreValid(
  formAnswersJson: PurposeFormAnswers,
  formSchemaVersion: PurposeFormSchemaVersion,
): void {
  const validate = compiledSchemas[formSchemaVersion];

  if (!validate(formAnswersJson)) {
    throw formAnswersValidationFailed(validate.errors ?? []);
  }
}
