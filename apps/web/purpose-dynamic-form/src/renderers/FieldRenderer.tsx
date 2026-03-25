import { useMemo } from "react";
import { match } from "ts-pattern";

import type {
  ControlElement,
  FormTexts,
  FormValues,
  JsonSchema,
} from "../engine/types";

import { scopeToFieldName } from "../engine/dependencyResolver";
import { getFilteredOptionValues } from "../engine/optionFilter";
import {
  getFieldDescription,
  getFieldLabel,
  getFieldOptionLabels,
} from "../engine/textsResolver";
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

  const label = control.label ?? getFieldLabel(texts, fieldName);
  const description = getFieldDescription(texts, fieldName);

  const options = useMemo(() => {
    const optionLabels =
      control.options?.optionLabels ?? getFieldOptionLabels(texts, fieldName);

    const prop = jsonSchema.properties[fieldName];
    const enumOrder: string[] =
      prop?.enum ?? prop?.items?.enum ?? Object.keys(optionLabels);

    const allOptions = enumOrder
      .filter((val) => val in optionLabels)
      .map((val) => ({ label: optionLabels[val] ?? val, value: val }));

    const hiddenValues = getFilteredOptionValues(control, allValues);
    if (!hiddenValues) return allOptions;

    return allOptions.filter((opt) => !hiddenValues.has(opt.value));
  }, [control, allValues, texts, fieldName, jsonSchema]);

  return match(widget)
    .with("radio", () => (
      <RadioRenderer
        description={description}
        error={error}
        label={label}
        onChange={(v) => onChange(v)}
        options={options}
        value={value as string}
      />
    ))
    .with("text", "textarea", () => (
      <TextRenderer
        description={description}
        error={error}
        isTextarea={widget === "textarea"}
        label={label}
        maxLength={maxLength}
        onChange={(v) => onChange(v)}
        value={value as string}
      />
    ))
    .with("checkbox", () => (
      <CheckboxRenderer
        description={description}
        error={error}
        label={label}
        onChange={(v) => onChange(v)}
        options={options}
        value={value as string[]}
      />
    ))
    .with("select", () => (
      <SelectRenderer
        description={description}
        error={error}
        label={label}
        onChange={(v) => onChange(v)}
        options={options}
        value={value as string}
      />
    ))
    .with("switch", () => {
      const switchOptionLabels =
        control.options?.optionLabels ?? getFieldOptionLabels(texts, fieldName);
      const switchLabel = switchOptionLabels["true"] ?? label ?? "";
      return (
        <SwitchRenderer
          description={description}
          error={error}
          label={label}
          onChange={(v) => onChange(v)}
          switchLabel={switchLabel}
          value={value as string}
        />
      );
    })
    .exhaustive();
}
