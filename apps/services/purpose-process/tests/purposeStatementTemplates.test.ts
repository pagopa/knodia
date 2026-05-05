import { KnodeId } from "@knodia/common-models/ids";
import {
  type PurposeFormVariant,
  purposeFormVariantByKnode,
} from "@knodia/purpose-models";
import { getPurposeStatementTemplates } from "@knodia/purpose-statement-template-models";
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
    const variant = purposeFormVariantByKnode[knodeId];
    for (const template of getPurposeStatementTemplates(knodeId)) {
      it(`[${knodeId}] "${template.name.en}" has valid formAnswers for variant ${variant}`, () => {
        expect(() =>
          validators[variant](template.formAnswers, template.formSchemaVersion),
        ).not.toThrow();
      });
    }
  }
});
