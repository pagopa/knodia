import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { CategoriesListModal } from "./CategoriesListModal";

describe("CategoriesListModal", () => {
  it("renders the title and one card per catalog category", () => {
    renderWithProviders(
      <CategoriesListModal isOpen onOpenChange={() => undefined} />,
    );

    expect(screen.getByText("Categories list")).toBeInTheDocument();
    expect(screen.getByText("Birth date")).toBeInTheDocument();
    expect(
      screen.getByText("That process the birth date for citizens."),
    ).toBeInTheDocument();
    // one definition card per catalog category
    expect(screen.getAllByText(/^That process the/)).toHaveLength(13);
  });

  it("does not render when isOpen is false", () => {
    renderWithProviders(
      <CategoriesListModal isOpen={false} onOpenChange={() => undefined} />,
    );

    expect(screen.queryByText("Categories list")).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when the user presses Escape", async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <CategoriesListModal isOpen onOpenChange={onOpenChange} />,
    );

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
