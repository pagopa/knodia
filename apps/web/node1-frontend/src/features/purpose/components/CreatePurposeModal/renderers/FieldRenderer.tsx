import { useMemo } from "react";
import { match } from "ts-pattern";

import type {
  ControlElement,
  FormTexts,
  FormValues,
  JsonSchema,
  JsonSchemaProperty,
} from "@/features/purpose/engine/types";

import { getFilteredOptionValues } from "@/features/purpose/engine/optionFilter";
import { scopeToFieldName } from "@/features/purpose/engine/scope";
import {
  getFieldDescription,
  getFieldLabel,
  getFieldOptionLabels,
} from "@/features/purpose/engine/textsResolver";

import { CheckboxRenderer } from "./CheckboxRenderer";
import { RadioRenderer } from "./RadioRenderer";
import { SelectRenderer } from "./SelectRenderer";
import { SwitchRenderer } from "./SwitchRenderer";
import { TextRenderer } from "./TextRenderer";

interface Props {
  allValues: FormValues;
  control: ControlElement;
  error?: string | undefined;
  jsonSchema: JsonSchema;
  onChange: (value: string | string[]) => void;
  texts: FormTexts;
  value: string | string[];
}

export function FieldRenderer({
  allValues,
  control,
  error,
  jsonSchema,
  onChange,
  texts,
  value,
}: Props) {
  const widget = control.options?.widget ?? "text";
  const fieldName = scopeToFieldName(control.scope);
  const schemaProperty = jsonSchema.properties[fieldName];
  const maxLength = schemaProperty?.maxLength;

  const label = getFieldLabel(texts, fieldName) ?? fieldName;
  const description = getFieldDescription(texts, fieldName);
  const optionValues = useMemo(
    () => getOptionValues(schemaProperty),
    [schemaProperty],
  );

  const optionLabels = useMemo(
    () => getFieldOptionLabels(texts, fieldName, optionValues),
    [texts, fieldName, optionValues],
  );

  const options = useMemo(() => {
    const allOptions = optionValues.map((optionValue) => ({
      label: optionLabels[optionValue] ?? optionValue,
      value: optionValue,
    }));

    const hiddenValues = getFilteredOptionValues(control, allValues);
    if (!hiddenValues) return allOptions;

    return allOptions.filter((opt) => !hiddenValues.has(opt.value));
  }, [control, allValues, optionLabels, optionValues]);

  const resolvedControl: ControlElement = useMemo(
    () => ({
      ...control,
      label,
      options: control.options
        ? {
            ...control.options,
            description,
            infoLabel: description,
            optionLabels,
          }
        : undefined,
    }),
    [control, label, description, optionLabels],
  );

  return match(widget)
    .with("radio", () => (
      <RadioRenderer
        control={resolvedControl}
        error={error}
        onChange={(v) => onChange(v)}
        options={options}
        value={value as string}
      />
    ))
    .with("text", "textarea", () => (
      <TextRenderer
        control={resolvedControl}
        error={error}
        maxLength={maxLength}
        onChange={(v) => onChange(v)}
        value={value as string}
      />
    ))
    .with("checkbox", () => (
      <CheckboxRenderer
        control={resolvedControl}
        error={error}
        onChange={(v) => onChange(v)}
        options={options}
        value={value as string[]}
      />
    ))
    .with("select", () => (
      <SelectRenderer
        control={resolvedControl}
        error={error}
        onChange={(v) => onChange(v)}
        options={options}
        value={value as string}
      />
    ))
    .with("switch", () => (
      <SwitchRenderer
        control={resolvedControl}
        error={error}
        onChange={(v) => onChange(v)}
        value={value as string}
      />
    ))
    .exhaustive();
}

function getOptionValues(
  schemaProperty: JsonSchemaProperty | undefined,
): string[] {
  if (!schemaProperty) return [];
  if (schemaProperty.type === "array") {
    return schemaProperty.items?.enum ?? [];
  }
  return schemaProperty.enum ?? [];
}
