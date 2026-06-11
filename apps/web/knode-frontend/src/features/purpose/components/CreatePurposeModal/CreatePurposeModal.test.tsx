import { describe, expect, it, vi } from "vitest";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { CreatePurposeModal } from "./CreatePurposeModal";

const MOCK_KNODE_ID = "Orion" as const;
const MAX_DAILY_CALLS_PER_CONSUMER = 100;

const mockEservice = {
  id: "eservice-123",
  maxDailyCalls: { perConsumer: MAX_DAILY_CALLS_PER_CONSUMER, perKnode: 1000 },
  name: "Test E-Service",
} as ConsumptionEserviceDetail;

function renderWizard(onClose = vi.fn()) {
  return {
    onClose,
    ...renderWithProviders(
      <CreatePurposeModal
        eservice={mockEservice}
        knodeId={MOCK_KNODE_ID}
        onClose={onClose}
      />,
    ),
  };
}

describe("CreatePurposeModal", () => {
  it("shows e-service maxDailyCallsPerConsumer in the daily calls field description", async () => {
    renderWizard();

    await waitFor(() => {
      expect(
        screen.getByText(
          new RegExp(`up to ${MAX_DAILY_CALLS_PER_CONSUMER} API calls/day`),
        ),
      ).toBeInTheDocument();
    });
  });

  it("validates dailyCalls against the e-service limit", async () => {
    const { user } = renderWizard();

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Name"), "Valid Purpose Name");
    await user.type(
      screen.getByLabelText("Description"),
      "A valid description for testing purposes",
    );

    const dailyCallsInput = screen.getByRole("textbox", {
      name: "How many API calls do you plan to make per day?",
    });
    await user.clear(dailyCallsInput);
    await user.type(dailyCallsInput, String(MAX_DAILY_CALLS_PER_CONSUMER + 1));

    // onDynamic validator runs on submit (revalidateLogic default mode)
    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          new RegExp(`Must be at most ${MAX_DAILY_CALLS_PER_CONSUMER}`),
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows leave confirmation modal and calls onClose when confirmed", async () => {
    const { onClose, user } = renderWizard();

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Name"), "Valid Purpose Name");

    await user.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Leave process and discard changes"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Leave anyway" }));
    expect(onClose).toHaveBeenCalled();
  });
});
