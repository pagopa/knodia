import type { AccessibilityLang } from "./lang.ts";

import enContent from "./content/en.json" with { type: "json" };
import itContent from "./content/it.json" with { type: "json" };
import { AccessibilityDocument } from "./schema.ts";

// Parsed once at module load; total over the language union so lookups can't miss.
const DOCUMENTS: Record<AccessibilityLang, AccessibilityDocument> = {
  en: AccessibilityDocument.parse(enContent),
  it: AccessibilityDocument.parse(itContent),
};

export function getAccessibilityDocument(
  lang: AccessibilityLang,
): AccessibilityDocument {
  return DOCUMENTS[lang];
}
