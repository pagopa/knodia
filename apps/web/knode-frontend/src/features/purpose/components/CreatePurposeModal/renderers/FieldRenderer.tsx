import { useMemo } from "react";
import { match } from "ts-pattern";

import type {
  ControlElement,
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
import { DeclaredByProducerTooltip } from "./DeclaredByProducerTooltip";
import { RadioRenderer } from "./RadioRenderer";
import { SelectRenderer } from "./SelectRenderer";
import { SwitchRenderer } from "./SwitchRenderer";
import { TextRenderer } from "./TextRenderer";

interface Props {
  allValues: FormValues;
  control: ControlElement;
  error?: string | undefined;
  isReadOnly?: boolean | undefined;
  jsonSchema: JsonSchema;
  onChange: (value: string | string[]) => void;
  texts: Record<string, string>;
  value: string | string[];
}

export function FieldRenderer({
  allValues,
  control,
  error,
  isReadOnly,
  jsonSchema,
  onChange,
  texts,
  value,
}: Props) {
  const widget = control.options?.widget ?? "text";
  const fieldName = scopeToFieldName(control.scope);
  const schemaProperty = jsonSchema.properties[fieldName];
  const maxLength = schemaProperty?.maxLength;

  const label = getFieldLabel(texts, fieldName);
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

  return match(widget)
    .with("radio", () => (
      <FieldWithTooltip isReadOnly={isReadOnly}>
        <RadioRenderer
          description={description}
          error={error}
          isReadOnly={isReadOnly}
          label={label}
          onChange={(v) => onChange(v)}
          options={options}
          value={value as string}
        />
      </FieldWithTooltip>
    ))
    .with("text", "textarea", (w) => (
      // TextRenderer renders its own tooltip inside the field for "text"; for
      // "textarea" we wrap externally below.
      <FieldWithTooltip isReadOnly={isReadOnly && w === "textarea"}>
        <TextRenderer
          description={description}
          error={error}
          isReadOnly={isReadOnly}
          label={label}
          maxLength={maxLength}
          onChange={(v) => onChange(v)}
          value={value as string}
          widget={w}
        />
      </FieldWithTooltip>
    ))
    .with("checkbox", () => (
      <FieldWithTooltip isReadOnly={isReadOnly}>
        <CheckboxRenderer
          description={description}
          error={error}
          isReadOnly={isReadOnly}
          label={label}
          onChange={(v) => onChange(v)}
          options={options}
          value={value as string[]}
        />
      </FieldWithTooltip>
    ))
    .with("select", () => (
      <FieldWithTooltip isReadOnly={isReadOnly}>
        <SelectRenderer
          description={description}
          error={error}
          isReadOnly={isReadOnly}
          label={label}
          onChange={(v) => onChange(v)}
          options={options}
          value={value as string}
        />
      </FieldWithTooltip>
    ))
    .with("switch", () => (
      <FieldWithTooltip isReadOnly={isReadOnly}>
        <SwitchRenderer
          checkedLabel={optionLabels["true"]}
          description={description}
          error={error}
          isReadOnly={isReadOnly}
          label={label}
          onChange={(v) => onChange(v)}
          value={value as string}
        />
      </FieldWithTooltip>
    ))
    .exhaustive();
}

function FieldWithTooltip({
  children,
  isReadOnly,
}: {
  children: React.ReactNode;
  isReadOnly?: boolean | undefined;
}) {
  if (!isReadOnly) return children;
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">{children}</div>
      <DeclaredByProducerTooltip />
    </div>
  );
}

function getOptionValues(
  schemaProperty: JsonSchemaProperty | undefined,
): string[] {
  if (!schemaProperty) return [];
  if (schemaProperty.type === "array") {
    return schemaProperty.items?.enum ?? [];
  }
  if (schemaProperty.const !== undefined) {
    return [schemaProperty.const];
  }
  return schemaProperty.enum ?? [];
}
