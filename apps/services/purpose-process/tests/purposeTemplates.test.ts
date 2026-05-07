import { KnodeId } from "@knodia/common-models/ids";
import { getPurposeTemplates } from "@knodia/purpose-template-models";
import { describe, expect, it } from "vitest";

import {
  loadFormSchemas,
  type PurposeFormVariant,
} from "../src/models/formSchemas.ts";
import { buildFormAnswersValidator } from "../src/utils/formAnswersValidator.ts";

// Each Knode runs a single purpose-process with a fixed PURPOSE_FORMS_DIR
// (see docker/compose.multinode.yaml). This test runs once for all Knodes,
// so we hardcode the variant each Knode is expected to use.
const purposeFormVariantByKnode = {
  Lynx: "basic",
  Orion: "withriskanalysis",
} as const satisfies Record<KnodeId, PurposeFormVariant>;

const validators: Record<
  PurposeFormVariant,
  ReturnType<typeof buildFormAnswersValidator>
> = {
  basic: buildFormAnswersValidator(loadFormSchemas("schemas-basic")),
  withriskanalysis: buildFormAnswersValidator(
    loadFormSchemas("schemas-withriskanalysis"),
  ),
};

describe("purpose templates: formAnswers validation", () => {
  for (const knodeId of KnodeId.options) {
    const variant = purposeFormVariantByKnode[knodeId];
    for (const template of getPurposeTemplates(knodeId)) {
      it(`[${knodeId}] "${template.name.en}" has valid formAnswers for variant ${variant}`, () => {
        expect(() =>
          validators[variant](
            template.formAnswersJson,
            template.formSchemaVersion,
          ),
        ).not.toThrow();
      });
    }
  }
});
