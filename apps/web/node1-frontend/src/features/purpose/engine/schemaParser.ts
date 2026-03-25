import type { FormValues, JsonSchema } from "./types";

export function getDefaultValues(schema: JsonSchema): FormValues {
  const values: FormValues = {};

  for (const [name, prop] of Object.entries(schema.properties)) {
    if (prop.default !== undefined) {
      values[name] = prop.default;
    } else if (prop.type === "array") {
      values[name] = [];
    } else if (prop.type === "string" && !prop.enum) {
      values[name] = "";
    }
    // Enum fields without a default (radios/selects) are left undefined
    // so AJV doesn't validate "" against the enum constraint
  }

  return values;
}
