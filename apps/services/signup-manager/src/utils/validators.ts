import type { SignupDbService } from "@knodia/db-signup/services";

import { type SignupUser, SignupUserStatus } from "@knodia/signup-models";

import {
  signupUserEmailAlreadyInUse,
  signupUserNotActive,
  signupUserNotOnboarded,
  signupUserNotSuspended,
} from "../models/errors.ts";

export async function assertSignupUserEmailDoesNotExist(
  email: string,
  signupDbService: SignupDbService,
): Promise<void> {
  const [emailAlreadyAssociated, emailChangeRequestEmailAlreadyExists] =
    await Promise.all([
      signupDbService.checkSignupUserEmailExists(email),
      signupDbService.checkEmailChangeRequestEmailExists(email),
    ]);

  if (emailAlreadyAssociated || emailChangeRequestEmailAlreadyExists) {
    throw signupUserEmailAlreadyInUse(email);
  }
}

export function assertSignupUserIsActive(user: SignupUser): void {
  if (user.status !== SignupUserStatus.enum.Active) {
    throw signupUserNotActive();
  }
}

export function assertSignupUserIsOnboarded(
  user: SignupUser | undefined,
): asserts user is SignupUser {
  // OnboardingPending isn't onboarded yet: reject like a missing user.
  if (!user || user.status === SignupUserStatus.enum.OnboardingPending) {
    throw signupUserNotOnboarded();
  }
}

export function assertSignupUserIsSuspended(user: SignupUser): void {
  if (user.status !== SignupUserStatus.enum.Suspended) {
    throw signupUserNotSuspended();
  }
}
