import { useMemo } from "react";
import { match } from "ts-pattern";

import type {
  ControlElement,
  FormValues,
  JsonSchema,
} from "@/features/purpose/engine/types";

import { scopeToFieldName } from "@/features/purpose/engine/dependencyResolver";
import { getFilteredOptionValues } from "@/features/purpose/engine/optionFilter";

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
  value: string | string[];
}

export function FieldRenderer({
  allValues,
  control,
  error,
  jsonSchema,
  onChange,
  value,
}: Props) {
  const widget = control.options?.widget ?? "text";
  const fieldName = scopeToFieldName(control.scope);
  const maxLength = jsonSchema.properties[fieldName]?.maxLength;

  const options = useMemo(() => {
    const optionLabels = control.options?.optionLabels ?? {};
    const allOptions = Object.entries(optionLabels).map(([val, label]) => ({
      label,
      value: val,
    }));

    const hiddenValues = getFilteredOptionValues(control, allValues);
    if (!hiddenValues) return allOptions;

    return allOptions.filter((opt) => !hiddenValues.has(opt.value));
  }, [control, allValues]);

  return match(widget)
    .with("radio", () => (
      <RadioRenderer
        control={control}
        error={error}
        onChange={(v) => onChange(v)}
        options={options}
        value={value as string}
      />
    ))
    .with("text", "textarea", () => (
      <TextRenderer
        control={control}
        error={error}
        maxLength={maxLength}
        onChange={(v) => onChange(v)}
        value={value as string}
      />
    ))
    .with("checkbox", () => (
      <CheckboxRenderer
        control={control}
        error={error}
        onChange={(v) => onChange(v)}
        options={options}
        value={value as string[]}
      />
    ))
    .with("select", () => (
      <SelectRenderer
        control={control}
        error={error}
        onChange={(v) => onChange(v)}
        options={options}
        value={value as string}
      />
    ))
    .with("switch", () => (
      <SwitchRenderer
        control={control}
        error={error}
        onChange={(v) => onChange(v)}
        value={value as string}
      />
    ))
    .exhaustive();
}
