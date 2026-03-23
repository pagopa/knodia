import { useMemo } from "react";

import { loadSchema, loadUiSchema } from "../engine/types";
import { collectErrorMessages } from "../engine/uischemaParser";
import { createZodValidator } from "../engine/zod/schemaBuilder";
import jsonSchema from "../schemas/two-form/schema.json";
import uischema from "../schemas/two-form/uischema.json";
import { TwoFormPage } from "./TwoFormPage";

const schema = loadSchema(jsonSchema);
const ui = loadUiSchema(uischema);

export function TwoFormZodPage() {
  const validate = useMemo(
    () => createZodValidator(schema, collectErrorMessages(ui)),
    [],
  );

  return (
    <TwoFormPage
      jsonSchema={schema}
      title="Create Purpose (Zod)"
      uischema={ui}
      validate={validate}
    />
  );
}
