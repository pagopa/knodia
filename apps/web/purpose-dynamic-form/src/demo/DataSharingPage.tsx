import { useMemo, useState } from "react";

import { DynamicForm } from "../components/DynamicForm";
import { createAjvValidator } from "../engine/ajv/validation";
import { type FormValues, loadSchema, loadUiSchema } from "../engine/types";
import { collectErrorMessages } from "../engine/uischemaParser";
import jsonSchema from "../schemas/data-sharing/schema.json";
import uischema from "../schemas/data-sharing/uischema.json";

const schema = loadSchema(jsonSchema);
const ui = loadUiSchema(uischema);

export function DataSharingPage() {
  const [submittedValues, setSubmittedValues] = useState<FormValues | null>(
    null,
  );

  const validate = useMemo(
    () => createAjvValidator(schema, collectErrorMessages(ui)),
    [],
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-blue-100 flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl text-blue-800">Data Sharing Agreement</h1>
      </div>

      <div className="flex justify-center flex-1">
        <div className="flex flex-col gap-10 max-w-160 w-full px-10 pt-10 pb-16">
          <DynamicForm
            jsonSchema={schema}
            onSubmit={setSubmittedValues}
            uischema={ui}
            validate={validate}
          />
        </div>
      </div>

      {submittedValues && (
        <div className="max-w-160 w-full mx-auto px-10 pb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Submitted Values
            </h2>
            <pre className="bg-gray-50 rounded-md p-4 text-xs overflow-auto max-h-96">
              {JSON.stringify(submittedValues, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
