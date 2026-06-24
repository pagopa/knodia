import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { DefinitionCard } from "./DefinitionCard";

describe("DefinitionCard", () => {
  it("renders the name and the description", () => {
    renderWithProviders(
      <DefinitionCard
        description="A short definition of the attribute."
        name="NUTS 3"
      />,
    );

    expect(screen.getByText("NUTS 3")).toBeInTheDocument();
    expect(
      screen.getByText("A short definition of the attribute."),
    ).toBeInTheDocument();
  });
});
