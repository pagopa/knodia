import { KnodeId } from "@knodia/common-models/ids";
import {
  type SignupGeneratedEntities,
  type SignupUser,
  SignupUserStatus,
  SuspensionReason,
} from "@knodia/signup-models";
import { match } from "ts-pattern";

import {
  type API_CurrentSignupUser,
  type API_KnodeAssignment,
  type API_OnboardedStatus,
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
  return match(signupUser)
    .with(undefined, () => ({
      onboardingStatus: API_OnboardingStatus.enum.NOT_COMPLETED,
    }))
    .with({ status: SignupUserStatus.enum.OnboardingPending }, (user) => ({
      // Provisioning still in progress: knodes don't exist yet, only the email.
      email: user.email,
      onboardingStatus: API_OnboardingStatus.enum.ONBOARDING_PENDING,
    }))
    .with(
      { status: SignupUserStatus.enum.Active },
      { status: SignupUserStatus.enum.Suspended },
      { status: SignupUserStatus.enum.DeletionPending },
      (user) => ({
        email: user.email,
        knodes: toAPI_KnodeAssignments(user.generatedEntities),
        onboardingStatus: toAPI_OnboardedStatus(user.status),
      }),
    )
    .exhaustive();
}

function toAPI_KnodeAssignments(
  generatedEntities: SignupGeneratedEntities,
): API_KnodeAssignment[] {
  return KnodeId.options.map((knode) => ({
    knode,
    organizationName: generatedEntities[knode].organizationName,
    username: generatedEntities[knode].userName,
  }));
}

function toAPI_OnboardedStatus(
  status: Exclude<SignupUserStatus, "OnboardingPending">,
): API_OnboardedStatus {
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
