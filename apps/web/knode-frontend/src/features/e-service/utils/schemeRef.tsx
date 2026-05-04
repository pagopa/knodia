import type { Key } from "react-aria-components";

import { SelectItem } from "@knodia/ui-kit/ui";

import type { SchemeRef } from "@/types/schemeRef";

const SEPARATOR = "$";
type SchemeRefDictionary = Record<string, Record<string, string>>;

export function formatSchemeRefLabels(
  refs: SchemeRef[],
  data: SchemeRefDictionary,
  { type = "conjunction" }: { type?: "conjunction" | "disjunction" } = {},
) {
  const labels = refs.map((ref) => data[ref.scheme]?.[ref.code] ?? ref.code);
  const separator = type === "disjunction" ? "or" : "and";

  if (labels.length <= 2) {
    return labels.join(` ${separator} `);
  }

  return `${labels.slice(0, -1).join(", ")} ${separator} ${labels.at(-1)}`;
}

export function parseSchemeRefKey(key: string): SchemeRef {
  const [scheme = "", code = ""] = key.split(SEPARATOR);
  return { code, scheme };
}

export function parseSchemeRefKeys(keys: Key[]): SchemeRef[] {
  return keys.map((v) => parseSchemeRefKey(String(v)));
}

export function renderSchemeRefItems(data: SchemeRefDictionary) {
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

export function toSchemeRefOptions(data: SchemeRefDictionary) {
  return Object.entries(data).flatMap(([scheme, codes]) =>
    Object.entries(codes).map(([code, name]) => ({
      id: `${scheme}${SEPARATOR}${code}`,
      label: name,
    })),
  );
}
