import { useMemo } from "react";

import { createAjvValidator } from "../engine/ajv/validation";
import { loadSchema, loadTexts, loadUiSchema } from "../engine/types";
import { collectErrorMessages } from "../engine/uischemaParser";
import textsData from "../schemas/three-step-form/texts.json";
import uischema from "../schemas/three-step-form/uischema.json";
import jsonSchema from "../schemas/two-form/schema.json";
import { TwoFormPage } from "./TwoFormPage";

const schema = loadSchema(jsonSchema);
const ui = loadUiSchema(uischema);
const texts = loadTexts(textsData);

export function ThreeStepFormPage() {
  const validate = useMemo(
    () => createAjvValidator(schema, collectErrorMessages(texts, schema)),
    [],
  );

  return (
    <TwoFormPage
      jsonSchema={schema}
      texts={texts}
      title="Three-Step Form"
      uischema={ui}
      validate={validate}
    />
  );
}
