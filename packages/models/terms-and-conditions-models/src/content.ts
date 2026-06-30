import type { TermsLang } from "./date.ts";

import enV1 from "./content/v1/en.json" with { type: "json" };
import itV1 from "./content/v1/it.json" with { type: "json" };
import { TermsDocument } from "./schema.ts";
import { TERMS_VERSION } from "./version.ts";

// Frozen content per version. A future revision adds a v2 entry and bumps
// TERMS_VERSION; v1 is never edited (its canonical text is the legal proof).
const DOCUMENTS: Record<number, Record<TermsLang, TermsDocument>> = {
  [TERMS_VERSION]: {
    en: TermsDocument.parse(enV1),
    it: TermsDocument.parse(itV1),
  },
};

export function getTermsDocument(
  lang: TermsLang,
  version: number = TERMS_VERSION,
): TermsDocument {
  const byLang = DOCUMENTS[version];
  if (!byLang) throw new Error(`Unknown T&C version: ${version}`);
  return byLang[lang];
}
