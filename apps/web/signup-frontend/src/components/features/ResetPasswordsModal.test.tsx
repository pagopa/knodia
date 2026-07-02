import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GENERIC_ERROR_MESSAGE } from "@/services/messages";

import { ResetPasswordsModal } from "./ResetPasswordsModal";

const { mockResetCredentials } = vi.hoisted(() => ({
  mockResetCredentials: vi.fn(),
}));

vi.mock("@/services/queries", () => ({
  resetCredentialsMutationOptions: () => ({ mutationFn: mockResetCredentials }),
}));

const EMAIL = "mario.rossi@example.org";

function renderModal(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ResetPasswordsModal email={EMAIL} isOpen onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

describe("ResetPasswordsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the copy with the caller email and the action enabled", () => {
    renderModal();

    const boldEmail = screen.getByText(EMAIL);
    expect(boldEmail).toHaveClass("font-bold");
    expect(boldEmail.closest("p")).toHaveTextContent(
      `You will receive new passwords at ${EMAIL}.`,
    );
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });

  it("closes the modal once the reset is requested", async () => {
    mockResetCredentials.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("disables cancel while the reset is in flight", async () => {
    // Never-resolving request keeps the mutation pending.
    mockResetCredentials.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled(),
    );
  });

  it("shows an error and keeps the action available when the request fails", async () => {
    mockResetCredentials.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      GENERIC_ERROR_MESSAGE,
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });
});
