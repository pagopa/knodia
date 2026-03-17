import type { FormValues, JsonSchema } from "./types";

export function getDefaultValues(schema: JsonSchema): FormValues {
  const values: FormValues = {};

  for (const [name, prop] of Object.entries(schema.properties)) {
    if (prop.default !== undefined) {
      values[name] = prop.default;
    } else if (prop.type === "array") {
      values[name] = [];
    } else {
      values[name] = "";
    }
  }

  return values;
}
