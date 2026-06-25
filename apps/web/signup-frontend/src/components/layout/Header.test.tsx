import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthContext } from "@/contexts/auth";

import { Header } from "./Header";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("@/contexts/auth", () => ({
  useAuthContext: vi.fn(),
}));

const mockUseAuthContext = vi.mocked(useAuthContext);

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls logout when the Logout button is clicked", async () => {
    const user = userEvent.setup();
    const logout = vi.fn();
    mockUseAuthContext.mockReturnValue({
      isAuthenticated: true,
      logout,
      sessionToken: null,
      sessionTokenClaims: null,
    });
    render(<Header />);

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(logout).toHaveBeenCalledOnce();
  });

  it("does not render the Logout button when unauthenticated", () => {
    mockUseAuthContext.mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
      sessionToken: null,
      sessionTokenClaims: null,
    });
    render(<Header />);

    expect(
      screen.queryByRole("button", { name: "Logout" }),
    ).not.toBeInTheDocument();
  });
});
