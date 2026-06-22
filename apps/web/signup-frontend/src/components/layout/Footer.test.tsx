import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the legal links pointing to the Knodia website, opening in a new tab", () => {
    render(<Footer />);

    const links = [
      { href: "https://knodia.org/privacy-policy", name: "Privacy Policy" },
      { href: "https://knodia.org/legal-notes", name: "Legal Notes" },
      { href: "https://knodia.org/company-details", name: "Company Details" },
    ];

    for (const { href, name } of links) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
