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

  it("renders the tagline below the Knodia logo", () => {
    render(<Footer />);

    const logo = screen.getByRole("img", { name: "Knodia" });
    const tagline = screen.getByText(
      "The Italian national proposal for cross-border interoperability",
    );
    expect(logo.compareDocumentPosition(tagline)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("does not render the Company Details link", () => {
    render(<Footer />);

    expect(
      screen.queryByRole("link", { name: "Company Details" }),
    ).not.toBeInTheDocument();
  });

  it("renders the logos as external links", () => {
    render(<Footer />);

    const logoLinks = [
      {
        href: "https://commission.europa.eu/index_en",
        name: "Logo NextGenerationEU",
        title: "Go to EU Commission website",
      },
      {
        href: "https://innovazione.gov.it/",
        name: "Logo Dipartimento per la trasformazione digitale",
        title: "Go to Dipartimento per la trasformazione digitale website",
      },
    ];

    for (const { href, name, title } of logoLinks) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute("title", title);
    }
  });

  it("credits PagoPA S.p.A. as a text link before the DTD logo", () => {
    render(<Footer />);

    const pagopa = screen.getByRole("link", { name: "PagoPA S.p.A." });
    expect(pagopa).toHaveAttribute(
      "href",
      "https://www.pagopa.it/en/homepage/",
    );
    expect(pagopa).toHaveAttribute("target", "_blank");
    expect(pagopa).toHaveAttribute("rel", "noopener noreferrer");
    expect(pagopa.closest("p")).toHaveTextContent(
      "Project implemented and managed by PagoPA S.p.A. on behalf of",
    );

    const dtd = screen.getByRole("link", {
      name: "Logo Dipartimento per la trasformazione digitale",
    });
    expect(pagopa.compareDocumentPosition(dtd)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
