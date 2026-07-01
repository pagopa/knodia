import { type signupManagerApi } from "@knodia/signup-manager-client";
import { match } from "ts-pattern";

export type OnboardingStatus =
  signupManagerApi.CurrentSignupUser["onboardingStatus"];

// Still mid-onboarding: stays on /registration without re-running the guard.
const ONBOARDING_IN_PROGRESS_STATUSES = [
  "NOT_COMPLETED",
  "ONBOARDING_PENDING",
] as const;

// DELETION_PENDING has no screen yet, so it parks on /registration too.
const REGISTRATION_STATUSES = [
  ...ONBOARDING_IN_PROGRESS_STATUSES,
  "DELETION_PENDING",
] as const;

// email lives only on the pending/onboarded variants of the discriminated union.
export const signupUserEmail = (
  user?: signupManagerApi.CurrentSignupUser,
): string | undefined => (user && "email" in user ? user.email : undefined);

export const isOnboardingPending = (status: OnboardingStatus) =>
  status === "ONBOARDING_PENDING";

export const keepsUserOnRegistration = (status: OnboardingStatus): boolean =>
  (ONBOARDING_IN_PROGRESS_STATUSES as readonly OnboardingStatus[]).includes(
    status,
  );

export const resolveOnboardingRedirect = (status: OnboardingStatus) =>
  match(status)
    .with("ACTIVE", () => "/home" as const)
    .with(...REGISTRATION_STATUSES, () => "/registration" as const)
    .with("SUSPENDED", () => "/suspended" as const)
    .exhaustive();

export type OnboardingDestination = ReturnType<
  typeof resolveOnboardingRedirect
>;
