import { describe, expect, it } from "vitest";

import type { TermsLang } from "../src/date.ts";

import { toAcceptedText } from "../src/canonical.ts";
import { getTermsDocument } from "../src/content.ts";
import { PlaceholderKind, TermsDocument } from "../src/schema.ts";
import { TERMS_VERSION, termsVersionLabel } from "../src/version.ts";

const requireDoc = (
  lang: TermsLang,
  version: number = TERMS_VERSION,
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
    "%s contains exactly one version and one date placeholder",
    (lang) => {
      const placeholders = requireDoc(lang)
        .blocks.flatMap((b) => b.content)
        .filter((f) => "placeholder" in f)
        .map((f) => ("placeholder" in f ? f.placeholder : ""));
      expect(placeholders).toEqual([
        PlaceholderKind.enum.version,
        PlaceholderKind.enum.date,
      ]);
    },
  );

  it("returns undefined for an unknown version", () => {
    expect(getTermsDocument("it", 999)).toBeUndefined();
  });

  // Snapshot pins the exact hashed text (legal proof): any edit to v1 content or the
  // canonical rules trips here.
  it("produces a stable canonical IT text for the digest", () => {
    const text = toAcceptedText(requireDoc("it", TERMS_VERSION), {
      date: "25 giugno 2026",
      version: termsVersionLabel(),
    });
    expect(text).toMatchSnapshot();
  });
});
