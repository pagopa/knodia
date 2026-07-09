import { describe, expect, it } from "vitest";

import { AccessibilityDocument, Fragment } from "../src/schema.ts";

describe("AccessibilityDocument schema", () => {
  it("parses a well-formed document with heading, paragraph and list blocks", () => {
    const parsed = AccessibilityDocument.parse({
      blocks: [
        { content: [{ text: "Section 1" }], level: 2, type: "heading" },
        { content: [{ text: "intro" }], type: "paragraph" },
        {
          items: [
            [{ text: "Name: Knodia" }],
            [
              { text: "URL: " },
              { text: "https://knodia.org", url: "https://knodia.org" },
            ],
            [{ email: "info@knodia.org" }],
          ],
          type: "list",
        },
      ],
    });
    expect(parsed.blocks).toHaveLength(3);
  });

  it("rejects an unknown block type", () => {
    expect(() =>
      AccessibilityDocument.parse({ blocks: [{ content: [], type: "quote" }] }),
    ).toThrow();
  });

  it("rejects extra keys (strict) and malformed link/email fragments", () => {
    expect(() => Fragment.parse({ color: "red", text: "x" })).toThrow();
    expect(() => Fragment.parse({ email: "not-an-email" })).toThrow();
    expect(() => Fragment.parse({ text: "x", url: "not-a-url" })).toThrow();
  });

  it("rejects a level-1 heading (content nests under the page's single h1)", () => {
    expect(() =>
      AccessibilityDocument.parse({
        blocks: [{ content: [{ text: "x" }], level: 1, type: "heading" }],
      }),
    ).toThrow();
  });

  it("rejects a list item that is not an array of fragments", () => {
    expect(() =>
      AccessibilityDocument.parse({
        blocks: [{ items: [{ text: "x" }], type: "list" }],
      }),
    ).toThrow();
  });
});
