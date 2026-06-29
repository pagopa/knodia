import { describe, expect, it } from "vitest";

import { toAcceptedText } from "../src/canonical.ts";
import { type TermsDocument } from "../src/schema.ts";

const doc: TermsDocument = {
  blocks: [
    { content: [{ text: "Termini" }], level: 1, type: "heading" },
    {
      content: [
        { text: "Versione " },
        { placeholder: "version" },
        { text: " del " },
        { placeholder: "date" },
        { text: "." },
      ],
      type: "paragraph",
    },
    {
      content: [
        { text: "scrivi a " },
        { email: "info@knodia.org" },
        { text: " per " },
        { bold: true, text: "info" },
      ],
      indent: 1,
      marker: "a)",
      type: "paragraph",
    },
  ],
};

const values = { date: "25 giugno 2026", version: "ver. 1" };

describe("toAcceptedText", () => {
  it("substitutes placeholders and concatenates fragments in reading order", () => {
    expect(toAcceptedText(doc, values)).toBe(
      [
        "Termini",
        "Versione ver. 1 del 25 giugno 2026.",
        "a) scrivi a info@knodia.org per info",
      ].join("\n"),
    );
  });

  it("prefixes a paragraph marker but emits no styling markup", () => {
    const text = toAcceptedText(doc, values);
    expect(text).toContain("a) scrivi a");
    expect(text).not.toMatch(/\*\*|<strong>|<em>/);
  });

  it("normalizes the output to NFC", () => {
    const nfd = "perch" + "e\u0301"; // "e" + combining acute accent (NFD)
    const nfc = "perch\u00e9"; // precomposed "\u00e9" (NFC)
    const text = toAcceptedText(
      { blocks: [{ content: [{ text: nfd }], type: "paragraph" }] },
      values,
    );
    expect(text).toBe(nfc);
    expect(text).not.toBe(nfd);
  });

  it("is stable: same input yields the same output", () => {
    expect(toAcceptedText(doc, values)).toBe(toAcceptedText(doc, values));
  });
});
