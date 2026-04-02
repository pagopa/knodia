import type { FormTexts } from "./types";

export function getBannerText(
  texts: FormTexts,
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  return texts.banners?.[key];
}

export function getFieldDescription(
  texts: FormTexts,
  field: string,
): string | undefined {
  return texts.fields[field]?.description;
}

export function getFieldErrorMessages(
  texts: FormTexts,
  field: string,
): Record<string, string> {
  return texts.fields[field]?.errors ?? {};
}

export function getFieldLabel(
  texts: FormTexts,
  field: string,
): string | undefined {
  return texts.fields[field]?.label;
}

export function getFieldOptionLabels(
  texts: FormTexts,
  field: string,
): Record<string, string> {
  return texts.fields[field]?.options ?? {};
}

export function getGroupDescription(
  texts: FormTexts,
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  return texts.groups?.[key]?.description;
}

export function getGroupLabel(
  texts: FormTexts,
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  return texts.groups?.[key]?.label;
}
