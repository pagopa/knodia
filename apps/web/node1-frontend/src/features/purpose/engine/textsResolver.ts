import type { FormTexts } from "./types";

export function getBannerText(
  texts: FormTexts,
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  return texts[`${key}.text`];
}

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
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  return texts[`${key}.description`];
}

export function getGroupLabel(
  texts: FormTexts,
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  return texts[`${key}.label`];
}
function getEntriesByPrefix(
  texts: FormTexts,
  prefix: string,
): [string, string][] {
  return Object.entries(texts).flatMap(([key, value]) =>
    key.startsWith(prefix) ? [[key.slice(prefix.length), value]] : [],
  );
}
