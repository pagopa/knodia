import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GENERIC_ERROR_MESSAGE } from "@/services/messages";

import { RequestErasureModal } from "./RequestErasureModal";

const { mockDeleteUser, mockNavigate } = vi.hoisted(() => ({
  mockDeleteUser: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createLink: (component: React.ComponentType) => component,
  useNavigate: () => mockNavigate,
}));

vi.mock("@/services/queries", () => ({
  deleteUserMutationOptions: () => ({ mutationFn: mockDeleteUser }),
  getCurrentSignupUserQuery: () => ({ queryKey: ["currentSignupUser"] }),
}));

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RequestErasureModal isOpen onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe("RequestErasureModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the 30-day copy with the action enabled", () => {
    renderModal();

    expect(
      screen.getByText(/This process may take up to 30 days\./),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Request erasure" }),
    ).toBeEnabled();
  });

  it("redirects to the registration page once the deletion is requested", async () => {
    mockDeleteUser.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Request erasure" }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/registration" }),
    );
  });

  it("disables cancel while the deletion is in flight", async () => {
    // Never-resolving request keeps the mutation pending.
    mockDeleteUser.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Request erasure" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled(),
    );
  });

  it("shows an error and keeps the action available when the request fails", async () => {
    mockDeleteUser.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Request erasure" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      GENERIC_ERROR_MESSAGE,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Request erasure" }),
    ).toBeEnabled();
  });
});
