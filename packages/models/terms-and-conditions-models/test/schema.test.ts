import { describe, expect, it } from "vitest";

import { Fragment, PlaceholderKind, TermsDocument } from "../src/schema.ts";

describe("TermsDocument schema", () => {
  it("parses a well-formed document", () => {
    const parsed = TermsDocument.parse({
      blocks: [
        { content: [{ text: "Art. 1" }], level: 2, type: "heading" },
        {
          content: [
            { placeholder: PlaceholderKind.enum.version },
            { email: "info@knodia.org" },
          ],
          marker: "a)",
          type: "paragraph",
        },
      ],
    });
    expect(parsed.blocks).toHaveLength(2);
  });

  it("rejects an unknown block type", () => {
    expect(() =>
      TermsDocument.parse({ blocks: [{ content: [], type: "list" }] }),
    ).toThrow();
  });

  it("rejects unknown placeholders and extra keys (strict)", () => {
    expect(() => Fragment.parse({ placeholder: "author" })).toThrow();
    expect(() => Fragment.parse({ color: "red", text: "x" })).toThrow();
  });

  it("rejects a malformed email fragment", () => {
    expect(() => Fragment.parse({ email: "not-an-email" })).toThrow();
  });

  it("rejects an empty paragraph marker (keeps schema and canonical serialization aligned)", () => {
    expect(() =>
      TermsDocument.parse({
        blocks: [{ content: [{ text: "x" }], marker: "", type: "paragraph" }],
      }),
    ).toThrow();
  });
});
