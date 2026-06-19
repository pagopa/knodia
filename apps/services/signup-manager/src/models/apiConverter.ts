import { type SignupUser, SignupUserStatus } from "@knodia/signup-models";
import { match } from "ts-pattern";

import { type API_CurrentSignupUser, API_OnboardingStatus } from "./api.ts";

export function toAPI_CurrentSignupUser(
  signupUser: SignupUser | undefined,
): API_CurrentSignupUser {
  if (!signupUser)
    return { onboardingStatus: API_OnboardingStatus.enum.NOT_COMPLETED };

  return {
    email: signupUser.email,
    onboardingStatus: toAPI_OnboardingStatus(signupUser.status),
  };
}

function toAPI_OnboardingStatus(
  status: SignupUserStatus,
): API_OnboardingStatus {
  return match(status)
    .with(SignupUserStatus.enum.Active, () => API_OnboardingStatus.enum.ACTIVE)
    .with(
      SignupUserStatus.enum.Suspended,
      () => API_OnboardingStatus.enum.SUSPENDED,
    )
    .with(
      SignupUserStatus.enum.DeletionPending,
      () => API_OnboardingStatus.enum.DELETION_PENDING,
    )
    .exhaustive();
}
