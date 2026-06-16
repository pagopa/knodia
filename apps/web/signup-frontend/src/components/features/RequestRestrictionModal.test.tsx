import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RequestRestrictionModal } from "./RequestRestrictionModal";

describe("RequestRestrictionModal", () => {
  it("preselects the first reason and lets the user pick another", async () => {
    const user = userEvent.setup();
    render(<RequestRestrictionModal isOpen onOpenChange={vi.fn()} />);

    const first = screen.getByRole("radio", { name: /Art\. 18\.1\.\(a\)/ });
    const second = screen.getByRole("radio", { name: /Art\. 18\.1\.\(b\)/ });
    expect(first).toBeChecked();

    await user.click(second);

    expect(second).toBeChecked();
    expect(first).not.toBeChecked();
  });
});
