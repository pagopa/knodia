import type { Key } from "react-aria-components";

import { SelectItem } from "@knodia/ui-kit/ui";

import type { SchemeRef } from "@/features/e-service/types/eserviceCreateForm";

const SEPARATOR = "$";

export function parseSchemeRefKeys(keys: Key[]): SchemeRef[] {
  return keys.map((v) => {
    const key = String(v);
    const [scheme = "", code = ""] = key.split(SEPARATOR);
    return { code, scheme };
  });
}

export function renderSchemeRefItems(
  data: Record<string, Record<string, string>>,
) {
  return Object.entries(data).flatMap(([scheme, codes]) =>
    Object.entries(codes).map(([code, name]) => {
      const id = `${scheme}${SEPARATOR}${code}`;
      return (
        <SelectItem id={id} key={id}>
          {name}
        </SelectItem>
      );
    }),
  );
}

export function toSchemeRefKey(ref: SchemeRef): string {
  return `${ref.scheme}${SEPARATOR}${ref.code}`;
}

export function toSchemeRefOptions(
  data: Record<string, Record<string, string>>,
) {
  return Object.entries(data).flatMap(([scheme, codes]) =>
    Object.entries(codes).map(([code, name]) => ({
      id: `${scheme}${SEPARATOR}${code}`,
      label: name,
    })),
  );
}
