import type { SignupDbService } from "@knodia/db-signup/services";
import type { UISignupSessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { SignupUser } from "@knodia/signup-models";

import {
  signupUserEmailAlreadyAssociated,
  signupUserIdentifierAlreadyAssociated,
  signupUserNotOnboarded,
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
    throw signupUserEmailAlreadyAssociated(email);
  }
}

export async function assertSignupUserIdentifiersDoNotExist(
  authData: UISignupSessionAuthData,
  signupDbService: SignupDbService,
): Promise<void> {
  const signupUser = await signupDbService.getSignupUserByIdentifiers({
    fiscalNumber: authData.fiscalNumber,
    personIdentifier: authData.personIdentifier,
    spidCode: authData.spidCode,
  });

  if (signupUser) {
    throw signupUserIdentifierAlreadyAssociated();
  }
}

export function assertSignupUserIsOnboarded(
  user: SignupUser | undefined,
): asserts user is SignupUser {
  if (!user) {
    throw signupUserNotOnboarded();
  }
}
