import type {
  EmailChangeRequestId,
  SignupUserId,
} from "@knodia/common-models/ids";
import type { EmailChangeRequest, SignupUser } from "@knodia/signup-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { genericInternalError } from "@knodia/common-models/errors";
import { eq, or, type SQL } from "drizzle-orm";

import {
  toEmailChangeRequest,
  toEmailChangeRequestSQL,
  toSignupUser,
  toSignupUserSQL,
} from "../converters/converters.ts";
import { emailChangeRequest, signupUser } from "../signupUser.ts";

export type SignupDbService = ReturnType<typeof signupDbServiceBuilder>;

export function signupDbServiceBuilder(db: NodePgDatabase) {
  return {
    async checkEmailChangeRequestEmailExists(email: string): Promise<boolean> {
      const result = await db
        .select({
          emailChangeRequestId: emailChangeRequest.emailChangeRequestId,
        })
        .from(emailChangeRequest)
        .where(eq(emailChangeRequest.email, email))
        .limit(1);

      return result.length > 0;
    },

    async checkSignupOrganizationNameAlreadyTaken(
      organizationName: string,
    ): Promise<boolean> {
      const result = await db
        .select()
        .from(signupUser)
        .where(
          or(
            eq(signupUser.lynxOrganizationName, organizationName),
            eq(signupUser.orionOrganizationName, organizationName),
          ),
        )
        .limit(1);
      return result.length > 0;
    },

    async checkSignupUserEmailChangeRequestExists(
      signupUserId: SignupUserId,
    ): Promise<boolean> {
      const result = await db
        .select({
          emailChangeRequestId: emailChangeRequest.emailChangeRequestId,
        })
        .from(emailChangeRequest)
        .where(eq(emailChangeRequest.signupUserId, signupUserId))
        .limit(1);

      return result.length > 0;
    },

    async checkSignupUserEmailExists(email: string): Promise<boolean> {
      const result = await db
        .select({ signupUserId: signupUser.signupUserId })
        .from(signupUser)
        .where(eq(signupUser.email, email))
        .limit(1);

      return result.length > 0;
    },

    async getEmailChangeRequestById(
      emailChangeRequestId: EmailChangeRequestId,
    ): Promise<EmailChangeRequest | undefined> {
      const [result] = await db
        .select()
        .from(emailChangeRequest)
        .where(
          eq(emailChangeRequest.emailChangeRequestId, emailChangeRequestId),
        )
        .limit(1);
      return result ? toEmailChangeRequest(result) : undefined;
    },

    async getSignupUserById(
      signupUserId: SignupUserId,
    ): Promise<SignupUser | undefined> {
      const [result] = await db
        .select()
        .from(signupUser)
        .where(eq(signupUser.signupUserId, signupUserId))
        .limit(1);
      return result ? toSignupUser(result) : undefined;
    },

    async getSignupUserByIdentifiers({
      fiscalNumber,
      personIdentifier,
      spidCode,
    }: {
      fiscalNumber?: string;
      personIdentifier?: string;
      spidCode?: string;
    }): Promise<SignupUser | undefined> {
      const identifierFilters = [
        fiscalNumber ? eq(signupUser.fiscalNumber, fiscalNumber) : undefined,
        personIdentifier
          ? eq(signupUser.personIdentifier, personIdentifier)
          : undefined,
        spidCode ? eq(signupUser.spidCode, spidCode) : undefined,
      ].filter((filter): filter is SQL => filter !== undefined);

      /**
       * This case should never happen, at least one identifier, depending on what Idp
       * the user used to sign up, should be present.
       * If this happens, it means there's a problem with the data we receive from the IdP
       * or with our mapping of that data, and we should investigate it.
       */
      if (identifierFilters.length === 0) {
        throw genericInternalError(
          "Missing all user identifiers claims (fiscalNumber, personIdentifier, spidCode)",
        );
      }

      const result = await db
        .select()
        .from(signupUser)
        .where(or(...identifierFilters))
        .limit(1);

      const signupUserResult = result.at(0);

      return signupUserResult ? toSignupUser(signupUserResult) : undefined;
    },

    async insertEmailChangeRequest(request: EmailChangeRequest): Promise<void> {
      await db
        .insert(emailChangeRequest)
        .values(toEmailChangeRequestSQL(request));
    },

    async insertSignupUser(user: SignupUser): Promise<void> {
      await db.insert(signupUser).values(toSignupUserSQL(user));
    },
  };
}
