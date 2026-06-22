import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChangeEmailModal } from "./ChangeEmailModal";

describe("ChangeEmailModal", () => {
  it("renders the email field and keeps the Change action disabled", () => {
    render(<ChangeEmailModal isOpen onOpenChange={vi.fn()} />);

    expect(screen.getByLabelText("New email address")).toBeVisible();
    expect(screen.getByRole("button", { name: "Change" })).toBeDisabled();
  });

  it("closes via the cancel button", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ChangeEmailModal isOpen onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
