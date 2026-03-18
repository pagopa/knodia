import { useMemo } from "react";

import type { FormValues, UISchema } from "../engine/types";

import {
  getVisibleFields,
  scopeToFieldName,
} from "../engine/dependencyResolver";
import { collectControls } from "../engine/uischemaParser";

export function useVisibleFields(uischema: UISchema, values: FormValues) {
  const visibleFieldNames = useMemo(
    () => getVisibleFields(uischema, values),
    [uischema, values],
  );

  const controls = useMemo(() => collectControls(uischema), [uischema]);

  const visibleControls = useMemo(
    () =>
      controls.filter((c) => visibleFieldNames.has(scopeToFieldName(c.scope))),
    [controls, visibleFieldNames],
  );

  return { visibleControls, visibleFieldNames };
}
