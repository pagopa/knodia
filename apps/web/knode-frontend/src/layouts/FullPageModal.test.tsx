import { Button } from "@knodia/ui-kit/ui";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { FullPageModal } from "./FullPageModal";

describe("FullPageModal", () => {
  it("renders as a dialog named by its title, containing its children", () => {
    renderWithProviders(
      <FullPageModal onClose={vi.fn()} title="Create E-Service">
        <Button>Inside content</Button>
      </FullPageModal>,
    );

    expect(
      screen.getByRole("dialog", { name: "Create E-Service" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Inside content" }),
    ).toBeInTheDocument();
  });

  it("calls onClose when the close button is pressed", async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <FullPageModal onClose={onClose} title="Create E-Service">
        <Button>Inside content</Button>
      </FullPageModal>,
    );

    await user.click(screen.getByRole("button", { name: "Close modal" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("routes Escape through onClose", async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <FullPageModal onClose={onClose} title="Create E-Service">
        <Button>Inside content</Button>
      </FullPageModal>,
    );

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
  });
});
