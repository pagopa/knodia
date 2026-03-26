import { createTestTokenPayload } from "@knodia/test-commons/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAuthToken,
  redirectToLogout,
  setAuthToken,
  setRefreshToken,
} from "@/test/mocks/auth";
import { server } from "@/test/msw/server";

vi.mock("@/libs/auth", () => import("@/test/mocks/auth"));

const BFF_URL = import.meta.env["BFF_URL"];

const mockSigninRedirect = vi.fn();
const mockRemoveUser = vi.fn();

let mockOidcState = {
  error: null as Error | null,
  isLoading: false,
  removeUser: mockRemoveUser,
  signinRedirect: mockSigninRedirect,
  user: null as null | { access_token: string },
};

vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAuth: () => mockOidcState,
}));

const mockNavigate = vi.fn();

vi.mock("@/libs/router", () => ({
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
}));

import { OidcAuthProvider } from "./AuthContext";
import { useAuth } from "./useAuthContext";

const fakeSessionToken = createTestTokenPayload({
  type: "ui-session",
  username: "jane.doe",
});

function AuthConsumer({
  onAuth,
}: {
  onAuth: (auth: ReturnType<typeof useAuth>) => void;
}) {
  const auth = useAuth();
  onAuth(auth);
  return null;
}

function renderWithAuth(onAuth: (auth: ReturnType<typeof useAuth>) => void) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <OidcAuthProvider>
        <AuthConsumer onAuth={onAuth} />
      </OidcAuthProvider>
    </QueryClientProvider>,
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOidcState = {
      error: null,
      isLoading: false,
      removeUser: mockRemoveUser,
      signinRedirect: mockSigninRedirect,
      user: null,
    };
    getAuthToken.mockReturnValue(null);
  });

  it("exchanges OIDC token and navigates to / on success", async () => {
    server.use(
      http.post(`${BFF_URL}/auth/ui-session`, () =>
        HttpResponse.json({
          refreshToken: "refresh-token",
          uiSessionToken: "session-token",
        }),
      ),
    );

    mockOidcState.user = { access_token: "cognito-token" };

    const onAuth = vi.fn();
    renderWithAuth(onAuth);

    await waitFor(() => {
      expect(setAuthToken).toHaveBeenCalledWith("session-token");
      expect(setRefreshToken).toHaveBeenCalledWith("refresh-token");
      expect(mockNavigate).toHaveBeenCalledWith({ replace: true, to: "/" });
    });
  });

  it("redirects to logout on exchange error", async () => {
    server.use(
      http.post(`${BFF_URL}/auth/ui-session`, () =>
        HttpResponse.json({ error: "invalid_token" }, { status: 401 }),
      ),
    );

    mockOidcState.user = { access_token: "bad-token" };

    const onAuth = vi.fn();
    renderWithAuth(onAuth);

    await waitFor(() => {
      expect(redirectToLogout).toHaveBeenCalled();
    });
  });

  it("does not exchange when already authenticated", () => {
    getAuthToken.mockReturnValue("existing-token");

    const onAuth = vi.fn();
    renderWithAuth(onAuth);

    const lastCall = onAuth.mock.calls.at(-1)?.[0];
    expect(lastCall?.isAuthenticated).toBe(true);
    expect(lastCall?.token).toBe("existing-token");
  });

  it("login() calls signinRedirect", () => {
    const onAuth = vi.fn();
    renderWithAuth(onAuth);

    const lastCall = onAuth.mock.calls.at(-1)?.[0];
    lastCall?.login();

    expect(mockSigninRedirect).toHaveBeenCalled();
  });

  it("provides username, roles, and organizationId from decoded UI session token", () => {
    getAuthToken.mockReturnValue(fakeSessionToken);

    const onAuth = vi.fn();
    renderWithAuth(onAuth);

    const lastCall = onAuth.mock.calls.at(-1)?.[0];
    expect(lastCall?.username).toBe("jane.doe");
    expect(lastCall?.roles).toEqual(["administrative"]);
    expect(lastCall?.organizationId).toEqual(expect.any(String));
  });

  it("username is null, roles is empty, and organizationId is null when not authenticated", () => {
    getAuthToken.mockReturnValue(null);

    const onAuth = vi.fn();
    renderWithAuth(onAuth);

    const lastCall = onAuth.mock.calls.at(-1)?.[0];
    expect(lastCall?.username).toBeNull();
    expect(lastCall?.roles).toEqual([]);
    expect(lastCall?.organizationId).toBeNull();
  });
});
