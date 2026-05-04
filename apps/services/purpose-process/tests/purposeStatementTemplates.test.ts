import { KnodeId } from "@knodia/common-models/ids";
import {
  getPurposeStatementTemplates,
  type PurposeFormVariant,
} from "@knodia/purpose-statement-template-models";
import { describe, expect, it } from "vitest";

import { loadFormSchemas } from "../src/models/formSchemas.ts";
import { buildFormAnswersValidator } from "../src/utils/formAnswersValidator.ts";

const validators: Record<
  PurposeFormVariant,
  ReturnType<typeof buildFormAnswersValidator>
> = {
  basic: buildFormAnswersValidator(loadFormSchemas("schemas-basic")),
  withriskanalysis: buildFormAnswersValidator(
    loadFormSchemas("schemas-withriskanalysis"),
  ),
};

describe("purpose statement templates: formAnswers validation", () => {
  for (const knodeId of KnodeId.options) {
    for (const template of getPurposeStatementTemplates(knodeId)) {
      it(`[${knodeId}] "${template.name.en}" has valid formAnswers for variant ${template.purposeFormVariant}`, () => {
        expect(() =>
          validators[template.purposeFormVariant](
            template.formAnswers,
            template.formSchemaVersion,
          ),
        ).not.toThrow();
      });
    }
  }
});
