import type { FormValues, JsonSchema } from "../engine/types";
import type { GroupLayout } from "../engine/uischemaParser";

import { isLabelVisible, scopeToFieldName } from "../engine/dependencyResolver";
import { FieldRenderer } from "../renderers/FieldRenderer";
import { InfoBanner } from "../renderers/InfoBanner";

interface GroupSectionProps {
  errors: Record<string, string>;
  group: GroupLayout;
  isLast: boolean;
  jsonSchema: JsonSchema;
  onChange: (fieldName: string, value: string | string[]) => void;
  values: FormValues;
  visibleFieldNames: Set<string>;
}

export function GroupSection({
  errors,
  group,
  isLast,
  jsonSchema,
  onChange,
  values,
  visibleFieldNames,
}: GroupSectionProps) {
  return (
    <div className="flex flex-col gap-6 py-6 first:pt-0">
      {group.label && (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-slate-700">
            {group.label}
          </h3>
          {group.description && (
            <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
              {group.description}
            </p>
          )}
        </div>
      )}
      {group.elements.map((element, i) => {
        if (element.type === "Label") {
          if (!isLabelVisible(element, values, visibleFieldNames)) return null;
          return <InfoBanner key={`label-${i}`} text={element.text} />;
        }
        const fieldName = scopeToFieldName(element.scope);
        if (!visibleFieldNames.has(fieldName)) return null;
        return (
          <FieldRenderer
            allValues={values}
            control={element}
            error={errors[fieldName]}
            jsonSchema={jsonSchema}
            key={fieldName}
            onChange={(v) => onChange(fieldName, v)}
            value={
              values[fieldName] ??
              (jsonSchema.properties[fieldName]?.type === "array" ? [] : "")
            }
          />
        );
      })}
      {!isLast && <hr className="border-slate-200" />}
    </div>
  );
}
