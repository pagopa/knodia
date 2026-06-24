import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GENERIC_ERROR_MESSAGE } from "@/services/messages";

import { RequestRestrictionModal } from "./RequestRestrictionModal";

const { mockNavigate, mockSuspendUser } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSuspendUser: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/services/queries", () => ({
  getCurrentSignupUserQuery: () => ({ queryKey: ["currentSignupUser"] }),
  suspendUserMutationOptions: () => ({ mutationFn: mockSuspendUser }),
}));

const confirmButton = () =>
  screen.getByRole("button", { name: "Request restriction" });

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RequestRestrictionModal isOpen onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe("RequestRestrictionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preselects the first reason and lets the user pick another", async () => {
    const user = userEvent.setup();
    renderModal();

    const first = screen.getByRole("radio", { name: /Art\. 18\.1\.\(a\)/ });
    const second = screen.getByRole("radio", { name: /Art\. 18\.1\.\(b\)/ });
    expect(first).toBeChecked();

    await user.click(second);

    expect(second).toBeChecked();
    expect(first).not.toBeChecked();
  });

  it("suspends with the default reason and redirects to the suspended page", async () => {
    mockSuspendUser.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderModal();

    await user.click(confirmButton());

    await waitFor(() =>
      expect(mockSuspendUser).toHaveBeenCalledWith(
        { body: { suspensionReason: "ACCURACY_CONTESTED" } },
        expect.anything(),
      ),
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/suspended" }),
    );
  });

  it("maps the selected GDPR article to its suspension reason", async () => {
    mockSuspendUser.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("radio", { name: /Art\. 18\.1\.\(c\)/ }));
    await user.click(confirmButton());

    await waitFor(() =>
      expect(mockSuspendUser).toHaveBeenCalledWith(
        { body: { suspensionReason: "DATA_NEEDED_FOR_LEGAL_CLAIMS" } },
        expect.anything(),
      ),
    );
  });

  it("disables cancel while the request is in flight", async () => {
    // Never-resolving request keeps the mutation pending.
    mockSuspendUser.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    renderModal();

    await user.click(confirmButton());

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled(),
    );
  });

  it("shows an error and keeps the action available when the request fails", async () => {
    mockSuspendUser.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderModal();

    await user.click(confirmButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      GENERIC_ERROR_MESSAGE,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(confirmButton()).toBeEnabled();
  });
});
