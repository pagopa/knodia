import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KnodeCard } from "./KnodeCard";

describe("KnodeCard", () => {
  it("renders the knode name, organization, username and CTA", () => {
    render(
      <KnodeCard
        knodeName="Orion"
        organizationName="Rigel 123 Org"
        prototypeHref="https://prototype.example"
        username="rigel_123_user"
      />,
    );

    expect(screen.getByRole("heading", { name: "Orion Knode" })).toBeVisible();
    expect(screen.getByText("Rigel 123 Org")).toBeVisible();
    expect(screen.getByText("rigel_123_user")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Access the prototype/ }),
    ).toBeVisible();
  });

  it("links to the prototype URL, opening it safely in a new tab", () => {
    render(
      <KnodeCard
        knodeName="Orion"
        organizationName="Rigel 123 Org"
        prototypeHref="https://prototype.example"
        username="rigel_123_user"
      />,
    );

    const link = screen.getByRole("link", { name: /Access the prototype/ });
    expect(link).toHaveAttribute("href", "https://prototype.example");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
