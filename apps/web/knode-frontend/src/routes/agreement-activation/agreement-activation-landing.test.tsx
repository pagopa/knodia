import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
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
    setExternalToken: vi.fn(original.setExternalToken),
  };
});

const BFF_URL = import.meta.env["BFF_URL"];

import { ExternalAuthProvider } from "@/contexts/external-auth/ExternalAuthContext";
import { setExternalToken } from "@/libs/external-auth";

import { AgreementActivationLandingPage } from "./index";

function renderLanding() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ExternalAuthProvider>
        <AgreementActivationLandingPage />
      </ExternalAuthProvider>
    </QueryClientProvider>,
  );
}

describe("Agreement-activation landing page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("renders the welcome card and Log in button", () => {
    renderLanding();

    expect(screen.getByText("Welcome to")).toBeInTheDocument();
    expect(screen.getByText("Orion Knode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log in/ })).toBeInTheDocument();
  });

  it("shows an error if the URL has no #token fragment when Log in is clicked", async () => {
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole("button", { name: /Log in/ }));

    expect(screen.getByText(/Invalid magic link/)).toBeInTheDocument();
  });

  it("exchanges the fragment token, persists the session token, and navigates to recap", async () => {
    window.history.replaceState(
      null,
      "",
      "/agreement-activation#token=mlt-xyz",
    );

    const exchangeBodies: unknown[] = [];
    server.use(
      http.post(`${BFF_URL}/auth/externalUiSession`, async ({ request }) => {
        exchangeBodies.push(await request.json());
        return HttpResponse.json({
          agreementId: "00000000-0000-0000-0000-000000000000",
          externalUiSessionToken: "ext-session-jwt",
        });
      }),
    );

    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole("button", { name: /Log in/ }));

    await vi.waitFor(() => {
      expect(setExternalToken).toHaveBeenCalledWith("ext-session-jwt");
    });

    expect(exchangeBodies).toEqual([{ magicLinkToken: "mlt-xyz" }]);
    expect(mockNavigate).toHaveBeenCalledWith({
      replace: true,
      to: "/agreement-activation/recap",
    });
  });

  it("shows an error banner when the exchange fails", async () => {
    window.history.replaceState(
      null,
      "",
      "/agreement-activation#token=mlt-xyz",
    );

    server.use(
      http.post(`${BFF_URL}/auth/externalUiSession`, () =>
        HttpResponse.json({ message: "Invalid" }, { status: 401 }),
      ),
    );

    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole("button", { name: /Log in/ }));

    await vi.waitFor(() => {
      expect(
        screen.getByText(/Activation link expired or invalid/),
      ).toBeInTheDocument();
    });
    expect(setExternalToken).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
