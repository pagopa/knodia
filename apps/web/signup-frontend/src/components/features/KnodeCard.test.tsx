import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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
      screen.getByRole("button", { name: /Access the prototype/ }),
    ).toBeVisible();
  });

  it("opens the prototype URL in a new tab when the CTA is pressed", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(
      <KnodeCard
        knodeName="Orion"
        organizationName="Rigel 123 Org"
        prototypeHref="https://prototype.example"
        username="rigel_123_user"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Access the prototype/ }),
    );

    expect(open).toHaveBeenCalledWith("https://prototype.example", "_blank");
  });
});
