import { type TermsDocument } from "@knodia/terms-and-conditions-models";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TermsRenderer } from "./TermsRenderer";

const document: TermsDocument = {
  blocks: [
    { content: [{ text: "Termini" }], level: 1, type: "heading" },
    {
      content: [
        { text: "Versione " },
        { placeholder: "knodiaVersion" },
        { text: " del " },
        { placeholder: "date" },
        { text: ". Scrivi " },
        { bold: true, text: "qui" },
        { text: " a " },
        { email: "info@knodia.org" },
      ],
      type: "paragraph",
    },
    { content: [{ text: "primo punto" }], marker: "a)", type: "paragraph" },
  ],
};

describe("TermsRenderer", () => {
  it("renders headings, resolved placeholders, bold and email links", () => {
    render(
      <TermsRenderer
        date="25 giugno 2026"
        document={document}
        knodiaVersion="ver. 1"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Termini" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Versione ver\. 1 del 25 giugno 2026/),
    ).toBeInTheDocument();
    expect(screen.getByText("qui").tagName).toBe("STRONG");

    const email = screen.getByRole("link", { name: "info@knodia.org" });
    expect(email).toHaveAttribute("href", "mailto:info@knodia.org");
  });

  it("prefixes a paragraph marker", () => {
    render(
      <TermsRenderer date="x" document={document} knodiaVersion="ver. 1" />,
    );
    expect(screen.getByText(/a\) primo punto/)).toBeInTheDocument();
  });
});
