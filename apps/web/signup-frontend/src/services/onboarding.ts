import { type signupManagerApi } from "@knodia/signup-manager-client";
import { match } from "ts-pattern";

type OnboardingStatus = signupManagerApi.CurrentSignupUser["onboardingStatus"];

export const resolveOnboardingRedirect = (status: OnboardingStatus) =>
  match(status)
    .with("ACTIVE", () => "/home" as const)
    .with("NOT_COMPLETED", "DELETION_PENDING", () => "/registration" as const)
    .with("SUSPENDED", () => "/suspended" as const)
    .exhaustive();
