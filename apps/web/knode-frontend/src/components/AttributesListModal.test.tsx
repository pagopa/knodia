import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { AttributesListModal } from "./AttributesListModal";

describe("AttributesListModal", () => {
  it("renders the title, section labels, every catalog attribute and the info banner", () => {
    renderWithProviders(
      <AttributesListModal isOpen onOpenChange={() => undefined} />,
    );

    expect(screen.getByText("Attributes list")).toBeInTheDocument();
    expect(screen.getByText("Main attributes")).toBeInTheDocument();
    expect(screen.getByText("Orgs personal attributes")).toBeInTheDocument();

    expect(screen.getByText("Testing Organization")).toBeInTheDocument();
    expect(screen.getByText("NUTS 3")).toBeInTheDocument();
    // one definition card per catalog attribute
    expect(screen.getAllByText(/^Organizations/)).toHaveLength(7);

    expect(
      screen.getByText(/each Organization has a unique identifying attribute/),
    ).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    renderWithProviders(
      <AttributesListModal isOpen={false} onOpenChange={() => undefined} />,
    );

    expect(screen.queryByText("Attributes list")).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when the user presses Escape", async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <AttributesListModal isOpen onOpenChange={onOpenChange} />,
    );

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
