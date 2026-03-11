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

  it("renders the login card with expected content", () => {
    render(<LoginPage />);

    expect(screen.getByText("Welcome to")).toBeInTheDocument();
    expect(screen.getByText("Orion Knode")).toBeInTheDocument();
    expect(screen.getByText("Part of Knodia")).toBeInTheDocument();
  });

  it("renders sign in button when not authenticated", () => {
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("calls login when the sign in button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockLogin).toHaveBeenCalledOnce();
  });

  it("shows error banner with retry button when an error occurs", () => {
    mockAuthState.error = new Error("Token exchange failed");

    render(<LoginPage />);

    expect(screen.getByText(/Unable to complete sign in/)).toBeInTheDocument();
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

  it("still renders the card when already authenticated", () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.token = "session-token";

    render(<LoginPage />);

    expect(screen.getByText("Welcome to")).toBeInTheDocument();
    expect(screen.getByText("Orion Knode")).toBeInTheDocument();
  });
});
