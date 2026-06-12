import type {
  EmailChangeRequestId,
  SignupUserId,
} from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { genericInternalError } from "@knodia/common-models/errors";
import {
  type EmailChangeRequest,
  type SignupUser,
  type SignupUserDeletion,
  SignupUserStatus,
} from "@knodia/signup-models";
import { and, eq, inArray, or, type SQL } from "drizzle-orm";

import {
  toDeletedSignupUserSQL,
  toEmailChangeRequest,
  toEmailChangeRequestSQL,
  toSignupUser,
  toSignupUserDeletion,
  toSignupUserSQL,
} from "../converters/converters.ts";
import {
  deletedSignupUser,
  emailChangeRequest,
  signupUser,
} from "../signupUser.ts";

export type SignupDbService = ReturnType<typeof signupDbServiceBuilder>;

// eslint-disable-next-line max-lines-per-function
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

    // Shipped ahead of its consumer: the signup-updater follow-up task
    // deprovisions the knodes and then calls this to finalize the deletion.
    async completeSignupUserDeletion(
      signupUserId: SignupUserId,
    ): Promise<void> {
      await db.transaction(async (tx) => {
        const [deleted] = await tx
          .delete(signupUser)
          .where(
            and(
              eq(signupUser.signupUserId, signupUserId),
              eq(signupUser.status, SignupUserStatus.enum.DeletionPending),
            ),
          )
          .returning({
            createdAt: signupUser.createdAt,
            updatedAt: signupUser.updatedAt,
          });

        if (deleted) {
          await tx.insert(deletedSignupUser).values(
            toDeletedSignupUserSQL({
              deletedAt: new Date(),
              // updatedAt was last written by the DeletionPending mark, so it
              // carries the time the user requested the deletion.
              deletionRequestedAt: deleted.updatedAt,
              signupCreatedAt: deleted.createdAt,
              signupUserId,
            }),
          );
          return;
        }

        // Idempotent under at-least-once consumption: a replay finds the row
        // gone but the registry entry present, anything else is an invalid
        // transition.
        const [existingDeletion] = await tx
          .select({ signupUserId: deletedSignupUser.signupUserId })
          .from(deletedSignupUser)
          .where(eq(deletedSignupUser.signupUserId, signupUserId))
          .limit(1);

        if (existingDeletion) {
          return;
        }

        const [existing] = await tx
          .select({ status: signupUser.status })
          .from(signupUser)
          .where(eq(signupUser.signupUserId, signupUserId))
          .limit(1);

        throw genericInternalError(
          `Cannot complete deletion of signup user ${signupUserId}: user ${existing ? `has status ${existing.status}` : "not found"}`,
        );
      });
    },

    async deleteEmailChangeRequest(
      emailChangeRequestId: EmailChangeRequestId,
    ): Promise<void> {
      await db
        .delete(emailChangeRequest)
        .where(
          eq(emailChangeRequest.emailChangeRequestId, emailChangeRequestId),
        );
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

    async getSignupUserDeletion(
      signupUserId: SignupUserId,
    ): Promise<SignupUserDeletion | undefined> {
      const [result] = await db
        .select()
        .from(deletedSignupUser)
        .where(eq(deletedSignupUser.signupUserId, signupUserId))
        .limit(1);
      return result ? toSignupUserDeletion(result) : undefined;
    },

    async getUniqueSignupUserByIdentifiers({
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
        .where(or(...identifierFilters));

      /**
       * Each identifier column is UNIQUE, so multiple rows here mean the claims
       * of one IdP session point at different users (e.g. the spidCode of one
       * row and the fiscalNumber of another): data corruption to investigate,
       * never silently pick one.
       */
      if (result.length > 1) {
        throw genericInternalError(
          "User identifier claims (fiscalNumber, personIdentifier, spidCode) match multiple signup users",
        );
      }

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

    async markSignupUserDeletionPending(
      signupUserId: SignupUserId,
    ): Promise<void> {
      const [updated] = await db
        .update(signupUser)
        .set({
          status: SignupUserStatus.enum.DeletionPending,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(signupUser.signupUserId, signupUserId),
            inArray(signupUser.status, [
              SignupUserStatus.enum.Active,
              SignupUserStatus.enum.Suspended,
            ]),
          ),
        )
        .returning({ signupUserId: signupUser.signupUserId });

      if (updated) {
        return;
      }

      /**
       * No row transitioned: either the user is already DeletionPending (retry,
       * idempotent no-op) or it disappeared/was deleted meanwhile (invalid
       * transition).
       */
      const [existing] = await db
        .select({ status: signupUser.status })
        .from(signupUser)
        .where(eq(signupUser.signupUserId, signupUserId))
        .limit(1);

      if (existing?.status === SignupUserStatus.enum.DeletionPending) {
        return;
      }

      throw genericInternalError(
        `Cannot mark signup user ${signupUserId} as DeletionPending: user ${existing ? `has status ${existing.status}` : "not found"}`,
      );
    },
    async updateSignupUserEmail({
      email,
      signupUserId,
    }: {
      email: string;
      signupUserId: SignupUserId;
    }): Promise<void> {
      await db
        .update(signupUser)
        .set({ email, updatedAt: new Date() })
        .where(eq(signupUser.signupUserId, signupUserId));
    },
  };
}
