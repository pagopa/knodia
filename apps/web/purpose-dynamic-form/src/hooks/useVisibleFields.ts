import { useMemo } from "react";

import type { FormValues, UISchema } from "../engine/types";

import {
  getVisibleFields,
  scopeToFieldName,
} from "../engine/dependencyResolver";
import { collectControls } from "../engine/uischemaParser";

export function useVisibleFields(
  uischema: UISchema,
  values: FormValues,
  externalValues?: FormValues,
) {
  const allValues = useMemo(
    () => ({ ...externalValues, ...values }),
    [externalValues, values],
  );

  const visibleFieldNames = useMemo(
    () => getVisibleFields(uischema, allValues),
    [uischema, allValues],
  );

  const controls = useMemo(() => collectControls(uischema), [uischema]);

  const visibleControls = useMemo(
    () =>
      controls.filter((c) => visibleFieldNames.has(scopeToFieldName(c.scope))),
    [controls, visibleFieldNames],
  );

  return { allValues, visibleControls, visibleFieldNames };
}
