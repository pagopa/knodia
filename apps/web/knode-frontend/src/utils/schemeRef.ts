import type { SchemeRef } from "@/types/schemeRef";

export const SCHEME_REF_SEPARATOR = "$";

export function toSchemeRefKey(ref: SchemeRef): string {
  return `${ref.scheme}${SCHEME_REF_SEPARATOR}${ref.code}`;
}
