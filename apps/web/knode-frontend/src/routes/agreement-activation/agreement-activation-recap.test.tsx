import type { bffApi } from "@knodia/bff-client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Component, type ReactNode, Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useRouter: () => ({ navigate: mockNavigate }),
}));

vi.mock("@/libs/external-auth", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/libs/external-auth")>();
  return {
    ...original,
    redirectToExternalSessionLanding: vi.fn(),
  };
});

const BFF_URL = import.meta.env["BFF_URL"];

import { ExternalAuthProvider } from "@/contexts/external-auth/ExternalAuthContext";
import {
  redirectToExternalSessionLanding,
  setExternalToken,
} from "@/libs/external-auth";

import { AgreementActivationRecapPage } from "./recap";

const baseDetails: bffApi.AgreementActivationDetails = {
  agreement: {
    id: "00000000-0000-0000-0000-000000000001",
    state: "PendingConsumerOperatorIdentification",
  },
  consumer: {
    id: "00000000-0000-0000-0000-000000000002",
    knodeId: "Orion",
    name: "Rigel",
  },
  eservice: {
    id: "00000000-0000-0000-0000-000000000003",
    name: { en: "Requesting proof of registration of birth" },
  },
  producer: {
    id: "00000000-0000-0000-0000-000000000004",
    knodeId: "Lynx",
    name: "Ursa",
  },
};

class TestErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return <div>error-boundary-caught</div>;
    }
    return this.props.children;
  }
}

function renderRecap({ withErrorBoundary = false } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const page = (
    <Suspense fallback={<div>suspense-fallback</div>}>
      <AgreementActivationRecapPage />
    </Suspense>
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <ExternalAuthProvider>
        {withErrorBoundary ? (
          <TestErrorBoundary>{page}</TestErrorBoundary>
        ) : (
          page
        )}
      </ExternalAuthProvider>
    </QueryClientProvider>,
  );
}

function setupActivateResponse(status: number) {
  server.use(
    http.post(`${BFF_URL}/external/agreementActivation/activate`, () => {
      if (status === 204) return new HttpResponse(null, { status: 204 });
      return HttpResponse.json({ message: "error" }, { status });
    }),
  );
}

function setupDetailsResponse(
  details: bffApi.AgreementActivationDetails | null,
  options: { status?: number } = {},
) {
  server.use(
    http.get(`${BFF_URL}/external/agreementActivation/details`, () => {
      if (details === null) {
        return HttpResponse.json(
          { message: "error" },
          { status: options.status ?? 500 },
        );
      }
      return HttpResponse.json(details);
    }),
  );
}

describe("Agreement-activation recap page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    setExternalToken("ext-session-jwt");
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("renders the recap card for a pending agreement", async () => {
    setupDetailsResponse(baseDetails);
    renderRecap();

    expect(
      await screen.findByText("Activate your Agreement"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Requesting proof of registration of birth"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ursa")).toBeInTheDocument();
    expect(screen.getByText("Rigel")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Activate Agreement" }),
    ).toBeInTheDocument();
  });

  it("renders a generic error when the agreement is Suspended", async () => {
    setupDetailsResponse({
      ...baseDetails,
      agreement: { ...baseDetails.agreement, state: "Suspended" },
    });
    renderRecap();

    expect(
      await screen.findByText(/Cannot activate Agreement/),
    ).toBeInTheDocument();
  });

  it("renders a generic error when the agreement is Archived", async () => {
    setupDetailsResponse({
      ...baseDetails,
      agreement: { ...baseDetails.agreement, state: "Archived" },
    });
    renderRecap();

    expect(
      await screen.findByText(/Cannot activate Agreement/),
    ).toBeInTheDocument();
  });

  it("activates the agreement and shows the confirmation card on 204", async () => {
    setupDetailsResponse(baseDetails);
    setupActivateResponse(204);

    const user = userEvent.setup();
    renderRecap();

    const activateBtn = await screen.findByRole("button", {
      name: "Activate Agreement",
    });

    // Flip the details endpoint to Active so the post-activate refetch
    // (triggered by invalidateQueries) drives the page to the success view.
    setupDetailsResponse({
      ...baseDetails,
      agreement: { ...baseDetails.agreement, state: "Active" },
    });

    await user.click(activateBtn);

    expect(await screen.findByText("Agreement activated!")).toBeInTheDocument();
  });

  it("clears the external session and reloads to landing on 401 from the details query", async () => {
    setupDetailsResponse(null, { status: 401 });
    renderRecap({ withErrorBoundary: true });

    await vi.waitFor(() => {
      expect(redirectToExternalSessionLanding).toHaveBeenCalled();
    });
    expect(
      sessionStorage.getItem("knodia_external_ui_session_token"),
    ).toBeNull();
  });
});
