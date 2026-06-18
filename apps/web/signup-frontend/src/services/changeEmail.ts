import { type AxiosError } from "axios";

const HTTP_STATUS_CONFLICT = 409;

export function changeEmailErrorMessage(error: AxiosError): string {
  // A conflict here can only mean the new email is already tied to another account.
  if (error.response?.status === HTTP_STATUS_CONFLICT) {
    return "This email address is already in use. Please choose a different one.";
  }

  return "Something went wrong while changing your email address. Please try again.";
}
