import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the legal links opening in a new tab", () => {
    render(<Footer />);

    const links = [
      { href: "/ui/privacy-policy", name: "Privacy Policy" },
      { href: "/ui/terms-and-conditions", name: "Terms and Conditions" },
    ];

    for (const { href, name } of links) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("does not render the Company Details link", () => {
    render(<Footer />);

    expect(
      screen.queryByRole("link", { name: "Company Details" }),
    ).not.toBeInTheDocument();
  });

  it("renders the partner logos as external links with the DTD logo first", () => {
    render(<Footer />);

    const logoLinks = [
      {
        href: "https://innovazione.gov.it/",
        name: "Logo Dipartimento per la trasformazione digitale",
        title: "Go to Dipartimento per la trasformazione digitale website",
      },
      {
        href: "https://www.pagopa.it/en/homepage/",
        name: "Logo PagoPA S.p.A.",
        title: "Go to PagoPA S.p.A. website",
      },
      {
        href: "https://commission.europa.eu/index_en",
        name: "Logo NextGenerationEU",
        title: "Go to EU Commission website",
      },
    ];

    for (const { href, name, title } of logoLinks) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute("title", title);
    }

    // DTD must come before PagoPA in the partners row.
    const dtd = screen.getByRole("link", {
      name: "Logo Dipartimento per la trasformazione digitale",
    });
    const pagopa = screen.getByRole("link", { name: "Logo PagoPA S.p.A." });
    expect(dtd.compareDocumentPosition(pagopa)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
