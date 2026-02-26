import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

let mockAuthState = {
  error: null as Error | null | undefined,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  logout: vi.fn(),
  token: null as null | string,
};

vi.mock("@/contexts/auth", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { LoginPage } from "./index";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      error: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      token: null,
    };
  });

  it("renders login button when not authenticated", () => {
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("calls login when the login button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(mockLogin).toHaveBeenCalledOnce();
  });

  it("shows a loader when isLoading is true", () => {
    mockAuthState.isLoading = true;

    render(<LoginPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Login" }),
    ).not.toBeInTheDocument();
  });

  it("shows error message with retry button when an error occurs", () => {
    mockAuthState.error = new Error("Token exchange failed");

    render(<LoginPage />);

    expect(
      screen.getByText("Login error: Token exchange failed"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("calls login when the retry button is clicked", async () => {
    mockAuthState.error = new Error("Auth failed");
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(mockLogin).toHaveBeenCalledOnce();
  });

  it("navigates to / when isAuthenticated is true", async () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.token = "session-token";

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        replace: true,
        to: "/",
      });
    });
  });

  it("renders nothing visible when already authenticated", () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.token = "session-token";

    render(<LoginPage />);

    expect(
      screen.queryByRole("button", { name: "Login" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText(/Login error/)).not.toBeInTheDocument();
  });
});
