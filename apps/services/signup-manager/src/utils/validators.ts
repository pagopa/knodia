import type { SignupDbService } from "@knodia/db-signup/services";
import type { UISignupSessionAuthData } from "@knodia/fastify-zod-api-commons/auth";

import {
  signupUserEmailAlreadyAssociated,
  signupUserIdentifierAlreadyAssociated,
} from "../models/errors.ts";

export async function assertSignupUserEmailDoesNotExist(
  email: string,
  signupDbService: SignupDbService,
): Promise<void> {
  const existing = await signupDbService.checkSignupUserEmailExists(email);

  if (existing) {
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
