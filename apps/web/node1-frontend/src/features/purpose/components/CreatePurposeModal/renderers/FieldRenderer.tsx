import { useMemo } from "react";
import { match } from "ts-pattern";

import type {
  ControlElement,
  FormTexts,
  FormValues,
  JsonSchema,
} from "@/features/purpose/engine/types";

import { scopeToFieldName } from "@/features/purpose/engine/dependencyResolver";
import { getFilteredOptionValues } from "@/features/purpose/engine/optionFilter";
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
  const maxLength = jsonSchema.properties[fieldName]?.maxLength;

  const label = getFieldLabel(texts, fieldName) ?? control.label;
  const description =
    getFieldDescription(texts, fieldName) ?? control.options?.infoLabel;

  const options = useMemo(() => {
    const textsOptionLabels = getFieldOptionLabels(texts, fieldName);
    const optionLabels =
      Object.keys(textsOptionLabels).length > 0
        ? textsOptionLabels
        : (control.options?.optionLabels ?? {});
    const allOptions = Object.entries(optionLabels).map(([val, lbl]) => ({
      label: lbl,
      value: val,
    }));

    const hiddenValues = getFilteredOptionValues(control, allValues);
    if (!hiddenValues) return allOptions;

    return allOptions.filter((opt) => !hiddenValues.has(opt.value));
  }, [control, allValues, texts, fieldName]);

  const textsOptionLabels = useMemo(
    () => getFieldOptionLabels(texts, fieldName),
    [texts, fieldName],
  );

  const resolvedControl: ControlElement = useMemo(
    () => ({
      ...control,
      label,
      options: control.options
        ? {
            ...control.options,
            description:
              getFieldDescription(texts, fieldName) ??
              control.options.description,
            infoLabel: description,
            optionLabels:
              Object.keys(textsOptionLabels).length > 0
                ? textsOptionLabels
                : control.options.optionLabels,
          }
        : undefined,
    }),
    [control, label, description, texts, fieldName, textsOptionLabels],
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
