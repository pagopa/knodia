import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";

import {
  changeEmailErrorMessage,
  pollCurrentUserUntilEmail,
} from "./changeEmail";
import { getCurrentSignupUserQuery } from "./queries";

function axiosProblemError(code?: string): AxiosError {
  const error = new AxiosError("request failed");
  error.response = {
    data: code ? { errors: [{ code, detail: "" }] } : {},
    status: 409,
  } as AxiosError["response"];
  return error;
}

describe("changeEmailErrorMessage", () => {
  it("returns the email-in-use message for the 011-0001 code", () => {
    expect(changeEmailErrorMessage(axiosProblemError("011-0001"))).toBe(
      "This email address is already in use. Please choose a different one.",
    );
  });

  it("returns the pending-change message for the 011-0004 code", () => {
    expect(changeEmailErrorMessage(axiosProblemError("011-0004"))).toBe(
      "You already have a pending email change. Please wait for it to be applied before requesting a new one.",
    );
  });

  it("returns a generic message when the problem code is unknown or absent", () => {
    expect(changeEmailErrorMessage(axiosProblemError())).toBe(
      "Something went wrong while changing your email address. Please try again.",
    );
  });
});

const CURRENT_USER_URL = "http://localhost:3000/user/me";
const OLD_EMAIL = "old@mail.com";
const NEW_EMAIL = "new@mail.com";

function seededQueryClient(email: string) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(getCurrentSignupUserQuery().queryKey, {
    email,
    onboardingStatus: "ACTIVE",
  });
  return queryClient;
}

describe("pollCurrentUserUntilEmail", () => {
  it("refetches until the new email is applied, then stops", async () => {
    let calls = 0;
    server.use(
      http.get(CURRENT_USER_URL, () => {
        calls += 1;
        return HttpResponse.json({
          email: calls >= 2 ? NEW_EMAIL : OLD_EMAIL,
          onboardingStatus: "ACTIVE",
        });
      }),
    );
    const queryClient = seededQueryClient(OLD_EMAIL);

    const applied = await pollCurrentUserUntilEmail(queryClient, NEW_EMAIL, {
      intervalMs: 5,
      maxAttempts: 5,
    });

    expect(applied).toBe(true);
    expect(calls).toBe(2);
    expect(
      queryClient.getQueryData(getCurrentSignupUserQuery().queryKey),
    ).toMatchObject({ email: NEW_EMAIL });
  });

  it("gives up after maxAttempts when the email never changes", async () => {
    let calls = 0;
    server.use(
      http.get(CURRENT_USER_URL, () => {
        calls += 1;
        return HttpResponse.json({
          email: OLD_EMAIL,
          onboardingStatus: "ACTIVE",
        });
      }),
    );
    const queryClient = seededQueryClient(OLD_EMAIL);

    const applied = await pollCurrentUserUntilEmail(queryClient, NEW_EMAIL, {
      intervalMs: 5,
      maxAttempts: 3,
    });

    expect(applied).toBe(false);
    expect(calls).toBe(3);
    expect(
      queryClient.getQueryData(getCurrentSignupUserQuery().queryKey),
    ).toMatchObject({ email: OLD_EMAIL });
  });
});
