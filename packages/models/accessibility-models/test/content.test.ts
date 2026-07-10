import { describe, expect, it } from "vitest";

import { getAccessibilityDocument } from "../src/content.ts";

describe("getAccessibilityDocument", () => {
  it("returns a parsed document for each language", () => {
    // Parsing happens at module load, so a non-empty result proves both JSON
    // files satisfy the schema (link/email fragments included).
    expect(getAccessibilityDocument("en").blocks.length).toBeGreaterThan(0);
    expect(getAccessibilityDocument("it").blocks.length).toBeGreaterThan(0);
  });

  it("opens each language with a level-2 heading (nested under the page h1)", () => {
    for (const lang of ["en", "it"] as const) {
      const first = getAccessibilityDocument(lang).blocks.at(0);
      expect(first).toMatchObject({ level: 2, type: "heading" });
    }
  });
});
