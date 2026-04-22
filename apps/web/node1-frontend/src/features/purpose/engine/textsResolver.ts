import type { FormTexts } from "./types";

export function getFieldDescription(
  texts: FormTexts,
  field: string,
): string | undefined {
  return texts[`${field}.description`];
}

export function getFieldErrorMessages(
  texts: FormTexts,
  field: string,
): Record<string, string> {
  return Object.fromEntries(getEntriesByPrefix(texts, `${field}.error.`));
}

export function getFieldLabel(
  texts: FormTexts,
  field: string,
): string | undefined {
  return texts[`${field}.label`];
}

export function getFieldOptionLabels(
  texts: FormTexts,
  field: string,
  optionValues: string[],
): Record<string, string> {
  return Object.fromEntries(
    optionValues.flatMap((optionValue) => {
      const label = texts[`${field}.${optionValue}`];
      return label ? [[optionValue, label] satisfies [string, string]] : [];
    }),
  );
}

export function getGroupDescription(
  texts: FormTexts,
  key: string,
): string | undefined {
  return texts[`${key}.description`];
}

export function getGroupLabel(
  texts: FormTexts,
  key: string,
): string | undefined {
  return texts[`${key}.label`];
}

// Shallow-merge the legal texts dictionary (field labels, descriptions, enum
// options, group titles) with the UI texts dictionary (validation error
// messages). The two dictionaries must have disjoint key sets, enforced at
// build time in `@knodia/purpose-process`.
export function mergeTexts(
  texts: Record<string, string>,
  uiTexts: Record<string, string>,
): Record<string, string> {
  const duplicates = Object.keys(texts).filter((k) => k in uiTexts);
  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate text keys across texts and uiTexts: ${duplicates.join(", ")}`,
    );
  }
  return { ...texts, ...uiTexts };
}

function getEntriesByPrefix(
  texts: FormTexts,
  prefix: string,
): [string, string][] {
  return Object.entries(texts).flatMap(([key, value]) =>
    key.startsWith(prefix) ? [[key.slice(prefix.length), value]] : [],
  );
}
