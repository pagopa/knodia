import { delay, http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GENERIC_ERROR_MESSAGE } from "@/services/messages";
import { getCurrentSignupUserQuery } from "@/services/queries";
import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { ChangeEmailModal } from "./ChangeEmailModal";

const CHANGE_EMAIL_URL = "/signup-manager/user/changeEmail";
const CURRENT_USER_URL = "/signup-manager/user/me";
const OLD_EMAIL = "old.email@example.com";
const NEW_EMAIL = "new.email@example.com";

// Acks the change request; the new email is observed separately via the poll.
const ackChangeEmail = () =>
  http.post(CHANGE_EMAIL_URL, () => new HttpResponse(null, { status: 204 }));

const currentUserReturns = (email: string) =>
  http.get(CURRENT_USER_URL, () =>
    HttpResponse.json({
      email,
      onboardingStatus: "ACTIVE",
      termsAcceptedAt: "2026-01-01T00:00:00.000Z",
    }),
  );

afterEach(() => {
  vi.useRealTimers();
});

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

  it("submits the new email and closes once the change is applied", async () => {
    let capturedBody: unknown;
    server.use(
      http.post(CHANGE_EMAIL_URL, async ({ request }) => {
        capturedBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
      currentUserReturns(NEW_EMAIL),
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
    server.use(ackChangeEmail(), currentUserReturns(OLD_EMAIL));
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
  });

  it("keeps polling until the new email lands, then closes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let calls = 0;
    server.use(
      ackChangeEmail(),
      http.get(CURRENT_USER_URL, () => {
        calls += 1;
        return HttpResponse.json({
          email: calls >= 2 ? NEW_EMAIL : OLD_EMAIL,
          onboardingStatus: "ACTIVE",
          termsAcceptedAt: "2026-01-01T00:00:00.000Z",
        });
      }),
    );
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ChangeEmailModal isOpen onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByLabelText("New email address"), NEW_EMAIL);
    await user.click(screen.getByRole("button", { name: "Change" }));

    // First poll still sees the old email; the next interval observes the change.
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("does not close before the request is acked even if the typed email already matches the cache", async () => {
    // POST never resolves, so the mutation stays pending and never acks.
    server.use(
      http.post(CHANGE_EMAIL_URL, async () => {
        await delay("infinite");
        return new HttpResponse(null, { status: 204 });
      }),
      currentUserReturns(NEW_EMAIL),
    );
    const onOpenChange = vi.fn();
    const { queryClient, user } = renderWithProviders(
      <ChangeEmailModal isOpen onOpenChange={onOpenChange} />,
    );
    // Seed the shared cache so it already holds the email the user will submit.
    queryClient.setQueryData(getCurrentSignupUserQuery().queryKey, {
      email: NEW_EMAIL,
      knodes: [],
      onboardingStatus: "ACTIVE",
      termsAcceptedAt: "2026-01-01T00:00:00.000Z",
    });

    await user.type(screen.getByLabelText("New email address"), NEW_EMAIL);
    await user.click(screen.getByRole("button", { name: "Change" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Change" })).toBeDisabled();
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("shows a banner and stays open when the change is never applied in time", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    server.use(ackChangeEmail(), currentUserReturns(OLD_EMAIL));
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ChangeEmailModal isOpen onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByLabelText("New email address"), NEW_EMAIL);
    await user.click(screen.getByRole("button", { name: "Change" }));

    await vi.advanceTimersByTimeAsync(30_000);

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent("taking longer than expected");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
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
