import { useMemo } from "react";

import { createAjvValidator } from "../engine/ajv/validation";
import { loadSchema, loadUiSchema } from "../engine/types";
import { collectErrorMessages } from "../engine/uischemaParser";
import uischema from "../schemas/three-step-form/uischema.json";
import jsonSchema from "../schemas/two-form/schema.json";
import { TwoFormPage } from "./TwoFormPage";

const schema = loadSchema(jsonSchema);
const ui = loadUiSchema(uischema);

export function ThreeStepFormPage() {
  const validate = useMemo(
    () => createAjvValidator(schema, collectErrorMessages(ui)),
    [],
  );

  return (
    <TwoFormPage
      jsonSchema={schema}
      title="Three-Step Form"
      uischema={ui}
      validate={validate}
    />
  );
}
