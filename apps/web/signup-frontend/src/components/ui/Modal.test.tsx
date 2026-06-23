import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders title, description and action buttons when open", () => {
    render(
      <Modal
        actionLabel="Request erasure"
        description="If you proceed, your account will be deleted."
        isOpen
        title="Request data erasure"
      />,
    );

    const dialog = screen.getByRole("dialog", {
      name: "Request data erasure",
    });
    expect(dialog).toBeVisible();
    expect(
      screen.getByText("If you proceed, your account will be deleted."),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Request erasure" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  it("calls onConfirm when the action button is pressed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <Modal
        actionLabel="Change"
        isOpen
        onConfirm={onConfirm}
        title="Change email address"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Change" }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("renders the error message when provided", () => {
    render(
      <Modal
        actionLabel="Request erasure"
        errorMessage="Something went wrong. Please try again."
        isOpen
        title="Request data erasure"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
  });

  it("closes via the cancel button", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal
        actionLabel="Change"
        isOpen
        onOpenChange={onOpenChange}
        title="Change email address"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
