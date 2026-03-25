import { useMemo } from "react";

import { createAjvValidator } from "../engine/ajv/validation";
import { loadSchema, loadTexts, loadUiSchema } from "../engine/types";
import { collectErrorMessages } from "../engine/uischemaParser";
import jsonSchema from "../schemas/two-form/schema.json";
import textsData from "../schemas/two-form/texts.json";
import uischema from "../schemas/two-form/uischema.json";
import { TwoFormPage } from "./TwoFormPage";

const schema = loadSchema(jsonSchema);
const ui = loadUiSchema(uischema);
const texts = loadTexts(textsData);

export function TwoFormAjvPage() {
  const validate = useMemo(
    () => createAjvValidator(schema, collectErrorMessages(texts, schema)),
    [],
  );

  return (
    <TwoFormPage
      jsonSchema={schema}
      texts={texts}
      title="Create Purpose (AJV)"
      uischema={ui}
      validate={validate}
    />
  );
}
