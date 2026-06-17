import { type signupManagerApi } from "@knodia/signup-manager-client";
import { match } from "ts-pattern";

type OnboardingStatus = signupManagerApi.CurrentSignupUser["onboardingStatus"];

export const resolveOnboardingRedirect = (status: OnboardingStatus) =>
  match(status)
    .with("ACTIVE", () => "/home" as const)
    .with("NOT_COMPLETED", () => "/registration" as const)
    .with("SUSPENDED", (): never => {
      // TODO(KN-750): the suspension flow will define where a suspended user goes
      throw new Error("Suspended user handling is not implemented yet");
    })
    .exhaustive();
