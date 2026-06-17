import { type AxiosError } from "axios";

const HTTP_STATUS_CONFLICT = 409;

export function confirmOnboardingErrorMessage(error: AxiosError): string {
  // A conflict here can only mean the email is already tied to an onboarded user.
  if (error.response?.status === HTTP_STATUS_CONFLICT) {
    return "This email address is already in use. Log in using the same sign-in method you used before.";
  }

  return "Something went wrong while creating your credentials. Please try again.";
}
