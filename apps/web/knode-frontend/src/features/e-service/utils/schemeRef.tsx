import type { Key } from "react-aria-components";

import { SelectItem } from "@knodia/ui-kit/ui";

import type { SchemeRef } from "@/types/schemeRef";

import { SCHEME_REF_SEPARATOR, toSchemeRefKey } from "@/utils/schemeRef";

export { toSchemeRefKey };

type SchemeRefDictionary = Record<string, Record<string, string>>;

export function parseSchemeRefKey(key: string): SchemeRef {
  const [scheme = "", code = ""] = key.split(SCHEME_REF_SEPARATOR);
  return { code, scheme };
}

export function parseSchemeRefKeys(keys: Key[]): SchemeRef[] {
  return keys.map((v) => parseSchemeRefKey(String(v)));
}

export function renderSchemeRefItems(data: SchemeRefDictionary) {
  return Object.entries(data).flatMap(([scheme, codes]) =>
    Object.entries(codes).map(([code, name]) => {
      const id = `${scheme}${SCHEME_REF_SEPARATOR}${code}`;
      return (
        <SelectItem id={id} key={id}>
          {name}
        </SelectItem>
      );
    }),
  );
}

export function toSchemeRefOptions(data: SchemeRefDictionary) {
  return Object.entries(data).flatMap(([scheme, codes]) =>
    Object.entries(codes).map(([code, name]) => ({
      id: `${scheme}${SCHEME_REF_SEPARATOR}${code}`,
      label: name,
    })),
  );
}
