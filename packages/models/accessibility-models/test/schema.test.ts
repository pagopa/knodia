import { describe, expect, it } from "vitest";

import { AccessibilityDocument, Fragment } from "../src/schema.ts";

describe("AccessibilityDocument schema", () => {
  it("parses a well-formed document with heading, marker, email and link fragments", () => {
    const parsed = AccessibilityDocument.parse({
      blocks: [
        { content: [{ text: "Section 1" }], level: 2, type: "heading" },
        {
          content: [
            { text: "URL: " },
            { text: "https://knodia.com", url: "https://knodia.com" },
            { email: "info@knodia.org" },
          ],
          marker: "●",
          type: "paragraph",
        },
      ],
    });
    expect(parsed.blocks).toHaveLength(2);
  });

  it("rejects an unknown block type", () => {
    expect(() =>
      AccessibilityDocument.parse({ blocks: [{ content: [], type: "list" }] }),
    ).toThrow();
  });

  it("rejects extra keys (strict) and malformed link/email fragments", () => {
    expect(() => Fragment.parse({ color: "red", text: "x" })).toThrow();
    expect(() => Fragment.parse({ email: "not-an-email" })).toThrow();
    expect(() => Fragment.parse({ text: "x", url: "not-a-url" })).toThrow();
  });

  it("rejects an empty paragraph marker", () => {
    expect(() =>
      AccessibilityDocument.parse({
        blocks: [{ content: [{ text: "x" }], marker: "", type: "paragraph" }],
      }),
    ).toThrow();
  });
});
