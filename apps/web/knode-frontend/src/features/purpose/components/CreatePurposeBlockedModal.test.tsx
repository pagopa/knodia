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
    expect(screen.getByText("Your Agreement is archived")).toBeInTheDocument();
    expect(
      screen.getByText(
        "To create a Purpose, you should have an active Agreement.",
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
      screen.queryByText("Your Agreement is archived"),
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

  it("renders the agreement-pending banner when agreement is PendingConsumerOperatorIdentification", () => {
    renderWithProviders(
      <CreatePurposeBlockedModal
        agreementState="PendingConsumerOperatorIdentification"
        eserviceState="Active"
        isOpen
        onOpenChange={() => undefined}
      />,
    );

    expect(screen.getByText("Create Purpose")).toBeInTheDocument();
    expect(
      screen.getByText("Your Agreement is pending confirmation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "To create a Purpose, an authorized operator from your organization must first confirm this Agreement on the Producer Knode.",
      ),
    ).toBeInTheDocument();
  });

  it("prefers eservice-archived over agreement-pending when eservice is Archived and agreement is Pending", () => {
    renderWithProviders(
      <CreatePurposeBlockedModal
        agreementState="PendingConsumerOperatorIdentification"
        eserviceState="Archived"
        isOpen
        onOpenChange={() => undefined}
      />,
    );

    expect(screen.getByText("This E-Service is Archived")).toBeInTheDocument();
    expect(
      screen.queryByText("Your Agreement is pending confirmation"),
    ).not.toBeInTheDocument();
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
