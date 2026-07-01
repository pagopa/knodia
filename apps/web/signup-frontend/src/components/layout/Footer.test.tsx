import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the legal links opening in a new tab", () => {
    render(<Footer />);

    const links = [
      { href: "/ui/privacy-policy", name: "Privacy Policy" },
      { href: "/ui/terms-and-conditions", name: "Terms and Conditions" },
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
