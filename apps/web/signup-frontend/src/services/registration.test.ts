import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { confirmOnboardingErrorMessage } from "./registration";

function axiosErrorWithStatus(status: number): AxiosError {
  const error = new AxiosError("request failed");
  error.response = { status } as AxiosError["response"];
  return error;
}

describe("confirmOnboardingErrorMessage", () => {
  it("returns the email-in-use message on a 409 conflict", () => {
    expect(confirmOnboardingErrorMessage(axiosErrorWithStatus(409))).toBe(
      "This email address is already in use. Log in using the same sign-in method you used before.",
    );
  });

  it("returns a generic message for other errors", () => {
    expect(confirmOnboardingErrorMessage(axiosErrorWithStatus(500))).toBe(
      "Something went wrong while creating your credentials. Please try again.",
    );
  });
});
