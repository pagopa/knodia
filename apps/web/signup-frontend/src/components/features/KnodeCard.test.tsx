import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KnodeCard } from "./KnodeCard";

describe("KnodeCard", () => {
  it("renders the knode name, organization, username and CTA", () => {
    render(
      <KnodeCard
        knodeName="Orion"
        organizationName="Rigel 123 Org"
        username="rigel_123_user"
      />,
    );

    expect(screen.getByRole("heading", { name: "Orion Knode" })).toBeVisible();
    expect(screen.getByText("Rigel 123 Org")).toBeVisible();
    expect(screen.getByText("rigel_123_user")).toBeVisible();
    expect(
      screen.getByRole("button", { name: /Access the prototype/ }),
    ).toBeVisible();
  });
});
