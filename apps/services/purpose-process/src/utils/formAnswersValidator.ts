import type {
  PurposeFormAnswers,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- ajv lacks ESM exports for node16 moduleResolution (https://github.com/ajv-validator/ajv/issues/2132)
const Ajv = require("ajv/dist/2020") as typeof import("ajv").default;
import type { ValidateFunction } from "ajv";

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
