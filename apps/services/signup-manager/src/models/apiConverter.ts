import type { SignupUser } from "@knodia/signup-models";

import type { API_CurrentSignupUser } from "./api.ts";

export function toAPI_CurrentSignupUser(
  signupUser: SignupUser | undefined,
): API_CurrentSignupUser {
  if (!signupUser) {
    return { onboardingStatus: "NOT_COMPLETED" };
  }

  return {
    email: signupUser.email,
    onboardingStatus: signupUser.status,
  };
}
