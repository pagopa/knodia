import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { pollCurrentUserUntilEmail } from "@/services/changeEmail";
import { GENERIC_ERROR_MESSAGE } from "@/services/messages";
import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { ChangeEmailModal } from "./ChangeEmailModal";

// Poll stubbed here; its own behavior is covered in changeEmail.test.ts.
vi.mock("@/services/changeEmail", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/changeEmail")>()),
  pollCurrentUserUntilEmail: vi.fn(() => Promise.resolve(true)),
}));

const CHANGE_EMAIL_URL = "/signup-manager/user/changeEmail";
const NEW_EMAIL = "new.email@example.com";

describe("ChangeEmailModal", () => {
  it("enables Change only once a valid email is entered", async () => {
    const { user } = renderWithProviders(
      <ChangeEmailModal isOpen onOpenChange={vi.fn()} />,
    );

    const field = screen.getByLabelText("New email address");
    const changeButton = screen.getByRole("button", { name: "Change" });
    expect(changeButton).toBeDisabled();

    await user.type(field, "not-an-email");
    expect(changeButton).toBeDisabled();

    await user.clear(field);
    await user.type(field, NEW_EMAIL);
    expect(changeButton).toBeEnabled();
  });

  it("closes via the cancel button", async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ChangeEmailModal isOpen onOpenChange={onOpenChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits the new email and closes on success", async () => {
    let capturedBody: unknown;
    server.use(
      http.post(CHANGE_EMAIL_URL, async ({ request }) => {
        capturedBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ChangeEmailModal isOpen onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByLabelText("New email address"), NEW_EMAIL);
    await user.click(screen.getByRole("button", { name: "Change" }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(capturedBody).toEqual({ email: NEW_EMAIL });
  });

  it("stays open with both buttons disabled until the change is applied", async () => {
    let resolvePoll!: (applied: boolean) => void;
    vi.mocked(pollCurrentUserUntilEmail).mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePoll = resolve;
      }),
    );
    server.use(
      http.post(
        CHANGE_EMAIL_URL,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ChangeEmailModal isOpen onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByLabelText("New email address"), NEW_EMAIL);
    await user.click(screen.getByRole("button", { name: "Change" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Change" })).toBeDisabled();
    });
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    resolvePoll(true);
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows the email-in-use error inline on the field and stays open", async () => {
    server.use(
      http.post(CHANGE_EMAIL_URL, () =>
        HttpResponse.json(
          { errors: [{ code: "011-0001", detail: "" }] },
          { status: 409 },
        ),
      ),
    );
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ChangeEmailModal isOpen onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByLabelText("New email address"), NEW_EMAIL);
    await user.click(screen.getByRole("button", { name: "Change" }));

    expect(
      await screen.findByText(
        "This email address is already in use. Please choose a different one.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("shows a generic error in the modal banner and stays open", async () => {
    server.use(
      http.post(
        CHANGE_EMAIL_URL,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ChangeEmailModal isOpen onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByLabelText("New email address"), NEW_EMAIL);
    await user.click(screen.getByRole("button", { name: "Change" }));

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent(GENERIC_ERROR_MESSAGE);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
