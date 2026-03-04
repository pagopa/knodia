import { describe, expect, it, vi } from "vitest";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { RequestAgreementModal } from "./RequestAgreementModal";

function createEservice(
  overrides?: Partial<ConsumptionEserviceDetail>,
): ConsumptionEserviceDetail {
  return {
    accessToken: {
      audience: ["https://api.example.com"],
      durationInMinutes: 60,
      type: "Bearer",
    },
    categories: [{ code: "birth-place", scheme: "eu-categories" }],
    description: "Test description",
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479" as ConsumptionEserviceDetail["id"],
    identificationRequired: false,
    interfaceDocument: { checksum: "abc123", name: "API Specs" },
    isSignalHubEnabled: false,
    maxDailyCalls: { perConsumer: 1000, perKnode: 10000 },
    mode: "ProvideData",
    name: "Test E-Service",
    producer: {
      email: "info@ursa.com",
      initials: "UM",
      knodeName: "Lynx Knode",
      name: "Ursa Major",
      notes: "Open Mon-Fri",
    },
    requiredAttributes: [[{ code: "NUTS3", possessed: true, scheme: "eu" }]],
    state: "Active",
    ...overrides,
  };
}

function renderModal(onClose = vi.fn()) {
  const eservice = createEservice();
  return {
    eservice,
    onClose,
    ...renderWithProviders(
      <RequestAgreementModal eservice={eservice} onClose={onClose} />,
    ),
  };
}

describe("RequestAgreementModal", () => {
  it("renders the form state with e-service details", () => {
    renderModal();

    expect(screen.getByText("Request Agreement")).toBeInTheDocument();
    expect(screen.getByText("Test E-Service")).toBeInTheDocument();
    expect(screen.getByText(/Ursa Major - Lynx Knode/)).toBeInTheDocument();
    expect(
      screen.getByText("Your organization has the required attributes."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request agreement" }),
    ).toBeInTheDocument();
  });

  it("shows error state when 'Request agreement' is clicked", async () => {
    const { user } = renderModal();

    await user.click(screen.getByRole("button", { name: "Request agreement" }));

    await waitFor(() => {
      expect(
        screen.getByText("The Agreement request went wrong"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/temporary malfunction in the Producer Knode/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onClose when 'Close' is clicked in error state", async () => {
    const onClose = vi.fn();
    const { user } = renderModal(onClose);

    await user.click(screen.getByRole("button", { name: "Request agreement" }));

    await waitFor(() => {
      expect(
        screen.getByText("The Agreement request went wrong"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when 'Cancel' is clicked in form state", async () => {
    const onClose = vi.fn();
    const { user } = renderModal(onClose);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows identification info when required", () => {
    const eservice = createEservice({ identificationRequired: true });
    renderWithProviders(
      <RequestAgreementModal eservice={eservice} onClose={vi.fn()} />,
    );

    expect(
      screen.getByText(
        /log into the Producer Knode to complete the identification process/,
      ),
    ).toBeInTheDocument();
  });
});
