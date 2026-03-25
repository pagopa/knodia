import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { RequestAgreementModal } from "./RequestAgreementModal";

const BASE_URL = "http://localhost:3000/bff";
const TEST_KNODE_ID = "Orion" as const;

function createEservice(
  overrides?: Partial<ConsumptionEserviceDetail>,
): ConsumptionEserviceDetail {
  return {
    accessToken: {
      audience: ["https://api.example.com"],
      durationInMinutes: 60,
      type: "Bearer",
    },
    agreement: { id: crypto.randomUUID(), state: "Active" },
    categories: [{ code: "birth-place", scheme: "eu-categories" }],
    description: "Test description",
    hasRequiredAttributes: true,
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479" as ConsumptionEserviceDetail["id"],
    identificationRequired: false,
    interfaceDocument: { checksum: "abc123", name: "API Specs" },
    isSignalHubEnabled: false,
    latestVersionId:
      "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" as ConsumptionEserviceDetail["latestVersionId"],
    maxDailyCalls: { perConsumer: 1000, perKnode: 10000 },
    mode: "ProvideData",
    name: "Test E-Service",
    producer: {
      email: "info@ursa.com",
      initials: "UM",
      knodeId: "Lynx",
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
      <RequestAgreementModal
        eservice={eservice}
        knodeId={TEST_KNODE_ID}
        onClose={onClose}
      />,
    ),
  };
}

function useErrorHandler() {
  server.use(
    http.post(`${BASE_URL}/consumer/agreements`, () =>
      HttpResponse.json(
        {
          correlationId: "test",
          status: 500,
          title: "Internal Server Error",
        },
        { status: 500 },
      ),
    ),
  );
}

describe("RequestAgreementModal", () => {
  it("renders the form state with e-service details", () => {
    renderModal();

    expect(screen.getByText("Request Agreement")).toBeInTheDocument();
    expect(screen.getByText("Test E-Service")).toBeInTheDocument();
    expect(screen.getByText(/Ursa Major - Lynx/)).toBeInTheDocument();
    expect(
      screen.getByText("Your organization has the required attributes."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request agreement" }),
    ).toBeInTheDocument();
  });

  it("sends the correct agreement seed in the request body", async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE_URL}/consumer/agreements`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: "new-agreement-123" }, { status: 201 });
      }),
    );

    const { user } = renderModal();

    await user.click(screen.getByRole("button", { name: "Request agreement" }));

    await waitFor(() => {
      expect(capturedBody).toEqual({
        eserviceId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        eserviceVersionId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        knodeId: TEST_KNODE_ID,
      });
    });
  });

  it("navigates to eservice detail page on successful agreement creation", async () => {
    server.use(
      http.post(`${BASE_URL}/consumer/agreements`, () =>
        HttpResponse.json({ id: "new-agreement-123" }, { status: 201 }),
      ),
    );

    const { router, user } = renderModal();

    await user.click(screen.getByRole("button", { name: "Request agreement" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/consumption/e-services/f47ac10b-58cc-4372-a567-0e02b2c3d479",
      );
      expect(router.state.location.search).toEqual({
        knodeId: TEST_KNODE_ID,
      });
    });
  });

  it("shows error state when agreement creation fails", async () => {
    useErrorHandler();

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
    useErrorHandler();

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

  it("disables confirm and shows warning when attributes are missing", () => {
    const eservice = createEservice({
      hasRequiredAttributes: false,
      requiredAttributes: [[{ code: "NUTS3", possessed: false, scheme: "eu" }]],
    });
    renderWithProviders(
      <RequestAgreementModal
        eservice={eservice}
        knodeId={TEST_KNODE_ID}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Your organization does not have the required attributes.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request agreement" }),
    ).toBeDisabled();
  });

  it("shows identification info when required", () => {
    const eservice = createEservice({ identificationRequired: true });
    renderWithProviders(
      <RequestAgreementModal
        eservice={eservice}
        knodeId={TEST_KNODE_ID}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/you will be required to log in to the Producer Knode/i),
    ).toBeInTheDocument();
  });
});
