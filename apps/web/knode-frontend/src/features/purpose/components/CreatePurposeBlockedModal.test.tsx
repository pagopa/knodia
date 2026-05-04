import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { CreatePurposeBlockedModal } from "./CreatePurposeBlockedModal";

describe("CreatePurposeBlockedModal", () => {
  it("renders the eservice-archived banner content when eservice is Archived", () => {
    renderWithProviders(
      <CreatePurposeBlockedModal
        agreementState="Active"
        eserviceState="Archived"
        isOpen
        onOpenChange={() => undefined}
      />,
    );

    expect(screen.getByText("Create Purpose")).toBeInTheDocument();
    expect(screen.getByText("This E-Service is Archived")).toBeInTheDocument();
    expect(
      screen.getByText("You can't create Purposes for an archived E-Service."),
    ).toBeInTheDocument();
  });

  it("renders the agreement-archived banner content when only the agreement is Archived", () => {
    renderWithProviders(
      <CreatePurposeBlockedModal
        agreementState="Archived"
        eserviceState="Active"
        isOpen
        onOpenChange={() => undefined}
      />,
    );

    expect(screen.getByText("Create Purpose")).toBeInTheDocument();
    expect(screen.getByText("You don't have an Agreement")).toBeInTheDocument();
    expect(
      screen.getByText(
        "To create a Purpose, you should have an Agreement for this E-Service.",
      ),
    ).toBeInTheDocument();
  });

  it("prefers eservice-archived over agreement-archived when both are Archived", () => {
    renderWithProviders(
      <CreatePurposeBlockedModal
        agreementState="Archived"
        eserviceState="Archived"
        isOpen
        onOpenChange={() => undefined}
      />,
    );

    expect(screen.getByText("This E-Service is Archived")).toBeInTheDocument();
    expect(
      screen.queryByText("You don't have an Agreement"),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when neither eservice nor agreement is Archived", () => {
    renderWithProviders(
      <CreatePurposeBlockedModal
        agreementState="Active"
        eserviceState="Active"
        isOpen
        onOpenChange={() => undefined}
      />,
    );

    expect(screen.queryByText("Create Purpose")).not.toBeInTheDocument();
  });

  it("does not render the modal when isOpen is false", () => {
    renderWithProviders(
      <CreatePurposeBlockedModal
        agreementState="Active"
        eserviceState="Archived"
        isOpen={false}
        onOpenChange={() => undefined}
      />,
    );

    expect(
      screen.queryByText("This E-Service is Archived"),
    ).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when the user presses Escape", async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <CreatePurposeBlockedModal
        agreementState="Active"
        eserviceState="Archived"
        isOpen
        onOpenChange={onOpenChange}
      />,
    );

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
