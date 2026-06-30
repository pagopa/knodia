import type { TermsLang } from "./date.ts";

import enV1 from "./content/v1/en.json" with { type: "json" };
import itV1 from "./content/v1/it.json" with { type: "json" };
import { TermsDocument } from "./schema.ts";
import { TERMS_VERSION } from "./version.ts";

// Keyed by literal version so v1 stays pinned even if TERMS_VERSION is bumped; v1 is
// never edited — its canonical text is the legal proof.
const DOCUMENTS: Record<number, Record<TermsLang, TermsDocument>> = {
  1: {
    en: TermsDocument.parse(enV1),
    it: TermsDocument.parse(itV1),
  },
};

export function getTermsDocument(
  lang: TermsLang,
  version: number = TERMS_VERSION,
): TermsDocument | undefined {
  return DOCUMENTS[version]?.[lang];
}
