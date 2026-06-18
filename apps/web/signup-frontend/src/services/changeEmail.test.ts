import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { changeEmailErrorMessage } from "./changeEmail";

function axiosErrorWithStatus(status: number): AxiosError {
  const error = new AxiosError("request failed");
  error.response = { status } as AxiosError["response"];
  return error;
}

describe("changeEmailErrorMessage", () => {
  it("returns the email-in-use message on a 409 conflict", () => {
    expect(changeEmailErrorMessage(axiosErrorWithStatus(409))).toBe(
      "This email address is already in use. Please choose a different one.",
    );
  });

  it("returns a generic message for other errors", () => {
    expect(changeEmailErrorMessage(axiosErrorWithStatus(500))).toBe(
      "Something went wrong while changing your email address. Please try again.",
    );
  });
});
