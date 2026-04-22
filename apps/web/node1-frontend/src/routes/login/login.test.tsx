import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLogin = vi.fn();

let mockAuthState = {
  error: null as Error | null | undefined,
  login: mockLogin,
};

vi.mock("@/contexts/auth", () => ({
  useAuth: () => mockAuthState,
}));

import { LoginPage } from "./index";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      error: null,
      login: mockLogin,
    };
  });

  it("renders the login card with expected content", () => {
    render(<LoginPage />);

    expect(screen.getByText("Welcome to")).toBeInTheDocument();
    expect(screen.getByText("Orion Knode")).toBeInTheDocument();
    expect(
      screen.getByText("Log in with your credentials to access the platform."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Once your account is activated, you can log in/),
    ).toBeInTheDocument();
    expect(screen.getByText("Part of Knodia")).toBeInTheDocument();
  });

  it("renders log in button when not authenticated", () => {
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("calls login when the log in button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(mockLogin).toHaveBeenCalledOnce();
  });

  it("shows error banner with retry button when an error occurs", () => {
    mockAuthState.error = new Error("Token exchange failed");

    render(<LoginPage />);

    expect(screen.getByText(/Unable to complete log in/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("calls login when the retry button is clicked", async () => {
    mockAuthState.error = new Error("Auth failed");
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(mockLogin).toHaveBeenCalledOnce();
  });
});
