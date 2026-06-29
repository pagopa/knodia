import { type AxiosError } from "axios";
import { z } from "zod";

import { GENERIC_ERROR_MESSAGE } from "./messages";

// signup-manager problem codes (see its models/errors.ts).
const EMAIL_ALREADY_IN_USE_CODE = "011-0001";
const PENDING_EMAIL_CHANGE_CODE = "011-0004";

const ProblemBody = z.object({
  errors: z.array(z.object({ code: z.string() })).min(1),
});

export function changeEmailErrorMessage(error: AxiosError): string {
  switch (firstProblemCode(error)) {
    case EMAIL_ALREADY_IN_USE_CODE:
      return "This email address is already in use. Please choose a different one.";
    case PENDING_EMAIL_CHANGE_CODE:
      return "You already have a pending email change. Please wait for it to be applied before requesting a new one.";
    default:
      return GENERIC_ERROR_MESSAGE;
  }
}

// Email-in-use is the only field-level error: it stays inline on the input, every
// other failure surfaces in the modal banner.
export function isEmailAlreadyInUseError(error: AxiosError): boolean {
  return firstProblemCode(error) === EMAIL_ALREADY_IN_USE_CODE;
}

function firstProblemCode(error: AxiosError): string | undefined {
  return ProblemBody.safeParse(error.response?.data).data?.errors.at(0)?.code;
}
