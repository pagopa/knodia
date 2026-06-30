import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import {
  changeEmailErrorMessage,
  isEmailAlreadyInUseError,
} from "./changeEmail";
import { GENERIC_ERROR_MESSAGE } from "./messages";

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
      GENERIC_ERROR_MESSAGE,
    );
  });
});

describe("isEmailAlreadyInUseError", () => {
  it("is true only for the 011-0001 code", () => {
    expect(isEmailAlreadyInUseError(axiosProblemError("011-0001"))).toBe(true);
  });

  it("is false for other codes and for an unknown or absent code", () => {
    expect(isEmailAlreadyInUseError(axiosProblemError("011-0004"))).toBe(false);
    expect(isEmailAlreadyInUseError(axiosProblemError())).toBe(false);
  });
});
