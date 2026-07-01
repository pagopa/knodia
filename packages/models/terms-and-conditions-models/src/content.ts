import type { TermsLang } from "./date.ts";

import enV1 from "./content/v1/en.json" with { type: "json" };
import itV1 from "./content/v1/it.json" with { type: "json" };
import { TermsDocument } from "./schema.ts";
import { TERMS_DOCUMENT_VERSION } from "./version.ts";

interface TermsRelease {
  content: Record<TermsLang, TermsDocument>;
  // "ver. N" printed in the body and hashed into the acceptance digest. Frozen with the
  // document so an accepted version always re-renders to the same bytes even after the current
  // Knodia version moves on. Independent from the document version key.
  knodiaVersion: number;
}

// Keyed by document version, with content and display version co-located so they can't
// diverge: adding a version must supply both. v1 is never edited — its canonical text is the
// legal proof.
const RELEASES: Record<number, TermsRelease> = {
  1: {
    content: {
      en: TermsDocument.parse(enV1),
      it: TermsDocument.parse(itV1),
    },
    knodiaVersion: 1,
  },
};

export function getTermsDocument(
  lang: TermsLang,
  version: number = TERMS_DOCUMENT_VERSION,
): TermsDocument | undefined {
  return RELEASES[version]?.content[lang];
}

// "ver. N" frozen for the given document version; undefined for an unmapped version. Pure
// lookup with no throw, so consumers wrap it fetch-or-throw like getTermsDocument.
export function knodiaVersionLabel(
  version: number = TERMS_DOCUMENT_VERSION,
): string | undefined {
  const release = RELEASES[version];
  return release ? `ver. ${release.knodiaVersion}` : undefined;
}
