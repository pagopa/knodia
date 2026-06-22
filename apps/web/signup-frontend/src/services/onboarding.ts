import { type signupManagerApi } from "@knodia/signup-manager-client";
import { match } from "ts-pattern";

type OnboardingStatus = signupManagerApi.CurrentSignupUser["onboardingStatus"];

export const resolveOnboardingRedirect = (status: OnboardingStatus) =>
  match(status)
    .with("ACTIVE", () => "/home" as const)
    .with("NOT_COMPLETED", () => "/registration" as const)
    .with("SUSPENDED", "DELETION_PENDING", (): never => {
      // TODO(KN-786/KN-787): the deletion (KN-786) and suspension (KN-787) flows will define where these users go
      throw new Error(
        "Suspended or deletion-pending user handling is not implemented yet",
      );
    })
    .exhaustive();
