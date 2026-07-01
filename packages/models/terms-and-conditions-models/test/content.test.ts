import { describe, expect, it } from "vitest";

import type { TermsLang } from "../src/date.ts";

import { toAcceptedText } from "../src/canonical.ts";
import { getTermsDocument, knodiaVersionLabel } from "../src/content.ts";
import { PlaceholderKind, TermsDocument } from "../src/schema.ts";
import { TERMS_DOCUMENT_VERSION } from "../src/version.ts";

const requireDoc = (
  lang: TermsLang,
  version: number = TERMS_DOCUMENT_VERSION,
): TermsDocument => {
  const doc = getTermsDocument(lang, version);
  if (doc === undefined) {
    throw new Error(`missing T&C document: ${lang} v${version}`);
  }
  return doc;
};

describe("v1 content", () => {
  it.each(["it", "en"] as const)("%s parses as a TermsDocument", (lang) => {
    expect(() => TermsDocument.parse(getTermsDocument(lang))).not.toThrow();
  });

  it.each(["it", "en"] as const)(
    "%s contains exactly one knodiaVersion and one date placeholder",
    (lang) => {
      const placeholders = requireDoc(lang)
        .blocks.flatMap((b) => b.content)
        .filter((f) => "placeholder" in f)
        .map((f) => ("placeholder" in f ? f.placeholder : ""));
      expect(placeholders).toEqual([
        PlaceholderKind.enum.knodiaVersion,
        PlaceholderKind.enum.date,
      ]);
    },
  );

  it("returns undefined for an unknown document version", () => {
    expect(getTermsDocument("it", 999)).toBeUndefined();
  });

  it("freezes the Knodia label per document version", () => {
    expect(knodiaVersionLabel(TERMS_DOCUMENT_VERSION)).toBe("ver. 1");
    expect(knodiaVersionLabel(999)).toBeUndefined();
  });

  // Snapshot pins the exact hashed text (legal proof): any edit to v1 content or the
  // canonical rules trips here.
  it("produces a stable canonical IT text for the digest", () => {
    const knodiaVersion = knodiaVersionLabel(TERMS_DOCUMENT_VERSION);
    if (knodiaVersion === undefined) {
      throw new Error(`missing Knodia label v${TERMS_DOCUMENT_VERSION}`);
    }
    const text = toAcceptedText(requireDoc("it", TERMS_DOCUMENT_VERSION), {
      date: "25 giugno 2026",
      knodiaVersion,
    });
    expect(text).toMatchSnapshot();
  });
});
