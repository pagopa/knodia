import type { Key } from "react-aria-components";

import { getAttribute } from "@knodia/attribute-models";
import { SelectItem } from "@knodia/ui-kit/ui";

import type { SchemeRef } from "@/types/schemeRef";

import { SCHEME_REF_SEPARATOR, toSchemeRefKey } from "@/utils/schemeRef";

export { toSchemeRefKey };

type SchemeRefDictionary = Record<string, Record<string, string>>;

export function getSchemeRefLabel(key: string): string {
  const ref = parseSchemeRefKey(key);
  return getAttribute(ref)?.name ?? ref.code;
}

export function parseSchemeRefKey(key: string): SchemeRef {
  // Split on the first separator only: a code may itself contain "$" (org names
  // are free text), and a greedy split would truncate it.
  const separatorIndex = key.indexOf(SCHEME_REF_SEPARATOR);
  if (separatorIndex === -1) {
    return { code: "", scheme: key };
  }
  return {
    code: key.slice(separatorIndex + 1),
    scheme: key.slice(0, separatorIndex),
  };
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
