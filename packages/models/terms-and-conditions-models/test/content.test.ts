import { describe, expect, it } from "vitest";

import { toAcceptedText } from "../src/canonical.ts";
import { getTermsDocument } from "../src/content.ts";
import { TermsDocument } from "../src/schema.ts";
import { TERMS_VERSION, termsVersionLabel } from "../src/version.ts";

describe("v1 content", () => {
  it.each(["it", "en"] as const)("%s parses as a TermsDocument", (lang) => {
    expect(() => TermsDocument.parse(getTermsDocument(lang))).not.toThrow();
  });

  it.each(["it", "en"] as const)(
    "%s contains exactly one version and one date placeholder",
    (lang) => {
      const placeholders = getTermsDocument(lang)
        .blocks.flatMap((b) => b.content)
        .filter((f) => "placeholder" in f)
        .map((f) => ("placeholder" in f ? f.placeholder : ""));
      expect(placeholders).toEqual(["version", "date"]);
    },
  );

  it("throws on an unknown version", () => {
    expect(() => getTermsDocument("it", 999)).toThrow();
  });

  // Snapshot pins the exact hashed text (legal proof): any accidental edit to the
  // v1 content or the canonical-form rules fails here (ST.3 guard).
  it("produces a stable canonical IT text for the digest", () => {
    const text = toAcceptedText(getTermsDocument("it", TERMS_VERSION), {
      date: "25 giugno 2026",
      version: termsVersionLabel(),
    });
    expect(text).toMatchSnapshot();
  });
});
