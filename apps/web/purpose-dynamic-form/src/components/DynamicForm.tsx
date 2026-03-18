import { useCallback, useMemo, useState } from "react";

import type {
  FormValues,
  JsonSchema,
  UISchema,
  ValidateFn,
} from "../engine/types";

import {
  getVisibleFields,
  isLabelVisible,
  scopeToFieldName,
} from "../engine/dependencyResolver";
import { getDefaultValues } from "../engine/schemaParser";
import { collectGroups } from "../engine/uischemaParser";
import { useVisibleFields } from "../hooks/useVisibleFields";
import { GroupSection } from "./GroupSection";

interface Props {
  jsonSchema: JsonSchema;
  onSubmit?: (values: FormValues) => void;
  uischema: UISchema;
  validate: ValidateFn;
}

export function DynamicForm({
  jsonSchema,
  onSubmit,
  uischema,
  validate,
}: Props) {
  const [values, setValues] = useState<FormValues>(() =>
    getDefaultValues(jsonSchema),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const groups = useMemo(() => collectGroups(uischema), [uischema]);
  const { visibleFieldNames } = useVisibleFields(uischema, values);

  const handleChange = useCallback(
    (fieldName: string, newValue: string | string[]) => {
      setValues((prev) => ({ ...prev, [fieldName]: newValue }));
      if (submitted) {
        setErrors((prev) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [fieldName]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [submitted],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitted(true);

      const visible = getVisibleFields(uischema, values);
      const fieldErrors = validate(values, visible);

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      setErrors({});
      const filtered: FormValues = {};
      for (const [key, val] of Object.entries(values)) {
        if (visible.has(key)) {
          filtered[key] = val;
        }
      }
      onSubmit?.(filtered);
    },
    [values, uischema, validate, onSubmit],
  );

  const visibleGroups = useMemo(
    () =>
      groups.filter((group) =>
        group.elements.some(
          (el) =>
            (el.type === "Control" &&
              visibleFieldNames.has(scopeToFieldName(el.scope))) ||
            (el.type === "Label" &&
              isLabelVisible(el, values, visibleFieldNames)),
        ),
      ),
    [groups, visibleFieldNames, values],
  );

  return (
    <form className="flex flex-col" onSubmit={handleSubmit}>
      {visibleGroups.map((group, groupIndex) => (
        <GroupSection
          errors={errors}
          group={group}
          isLast={groupIndex === visibleGroups.length - 1}
          jsonSchema={jsonSchema}
          key={group.label ?? groupIndex}
          onChange={handleChange}
          values={values}
          visibleFieldNames={visibleFieldNames}
        />
      ))}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 self-start mt-6"
        type="submit"
      >
        Submit
      </button>
    </form>
  );
}
