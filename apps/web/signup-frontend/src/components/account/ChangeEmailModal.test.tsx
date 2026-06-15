import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChangeEmailModal } from "./ChangeEmailModal";

describe("ChangeEmailModal", () => {
  it("enables the Change action only once a valid email is entered", async () => {
    const user = userEvent.setup();
    render(<ChangeEmailModal isOpen onOpenChange={vi.fn()} />);

    const change = screen.getByRole("button", { name: "Change" });
    expect(change).toBeDisabled();

    await user.type(screen.getByLabelText("New email address"), "not-an-email");
    expect(change).toBeDisabled();

    await user.type(screen.getByLabelText("New email address"), "@mail.com");
    expect(change).toBeEnabled();
  });

  it("closes on confirm", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ChangeEmailModal isOpen onOpenChange={onOpenChange} />);

    await user.type(
      screen.getByLabelText("New email address"),
      "user@mail.com",
    );
    await user.click(screen.getByRole("button", { name: "Change" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
