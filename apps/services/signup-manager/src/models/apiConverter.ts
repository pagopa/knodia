import {
  type SignupUser,
  SignupUserStatus,
  SuspensionReason,
} from "@knodia/signup-models";
import { match } from "ts-pattern";

import {
  type API_CurrentSignupUser,
  API_OnboardingStatus,
  API_SuspensionReason,
} from "./api.ts";

export function fromAPI_toSuspensionReason(
  reason: API_SuspensionReason,
): SuspensionReason {
  return match(reason)
    .with(
      API_SuspensionReason.enum.ACCURACY_CONTESTED,
      () => SuspensionReason.enum.AccuracyContested,
    )
    .with(
      API_SuspensionReason.enum.UNLAWFUL_PROCESSING,
      () => SuspensionReason.enum.UnlawfulProcessing,
    )
    .with(
      API_SuspensionReason.enum.DATA_NEEDED_FOR_LEGAL_CLAIMS,
      () => SuspensionReason.enum.DataNeededForLegalClaims,
    )
    .with(
      API_SuspensionReason.enum.PENDING_OBJECTION_VERIFICATION,
      () => SuspensionReason.enum.PendingObjectionVerification,
    )
    .exhaustive();
}

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
