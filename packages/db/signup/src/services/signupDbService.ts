/* eslint-disable max-lines-per-function */
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
  type SuspensionReason,
} from "@knodia/signup-models";
import { and, desc, eq, inArray, or, type SQL } from "drizzle-orm";

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
          .returning({ signupUserId: signupUser.signupUserId });

        if (deleted) {
          await tx
            .insert(deletedSignupUser)
            .values(
              toDeletedSignupUserSQL({ deletedAt: new Date(), signupUserId }),
            );
          return;
        }

        // Idempotent under at-least-once consumption: a replay finds the row
        // gone but the registry entry present, anything else is an invalid
        // transition.
        if (await hasRecordedDeletion(tx, signupUserId)) {
          return;
        }

        throw genericInternalError(
          `Cannot complete deletion of signup user ${signupUserId}: no DeletionPending row or deletion-registry entry found`,
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

      // The session token carries exactly one identifier, queried against a
      // UNIQUE column, so at most one row matches.
      const [result] = await db
        .select()
        .from(signupUser)
        .where(or(...identifierFilters))
        .limit(1);

      return result ? toSignupUser(result) : undefined;
    },

    async insertEmailChangeRequest(request: EmailChangeRequest): Promise<void> {
      await db
        .insert(emailChangeRequest)
        .values(toEmailChangeRequestSQL(request));
    },

    async insertSignupUser(user: SignupUser): Promise<void> {
      await db.insert(signupUser).values(toSignupUserSQL(user));
    },

    async listSuspendedSignupUsers(): Promise<SignupUser[]> {
      const results = await db
        .select()
        .from(signupUser)
        .where(eq(signupUser.status, SignupUserStatus.enum.Suspended))
        .orderBy(desc(signupUser.suspendedAt));
      return results.map(toSignupUser);
    },

    async markSignupUserDeletionPending(
      signupUserId: SignupUserId,
    ): Promise<void> {
      const [updated] = await db
        .update(signupUser)
        .set({
          status: SignupUserStatus.enum.DeletionPending,
          suspendedAt: null,
          suspensionReason: null,
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

      /**
       * The row may be gone because the deletion already completed: a retry
       * landing after completeSignupUserDeletion finds no signup_user row but a
       * registry entry. Mirror its idempotency and treat that as a no-op rather
       * than a 500.
       */
      if (!existing && (await hasRecordedDeletion(db, signupUserId))) {
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

    async updateSignupUserSuspension({
      signupUserId,
      suspendedAt,
      suspensionReason,
    }: {
      signupUserId: SignupUserId;
      suspendedAt: Date;
      suspensionReason: SuspensionReason;
    }): Promise<void> {
      await db
        .update(signupUser)
        .set({
          status: SignupUserStatus.enum.Suspended,
          suspendedAt,
          suspensionReason,
          updatedAt: new Date(),
        })
        .where(eq(signupUser.signupUserId, signupUserId));
    },
  };
}

// Accepts a transaction too: a PgTransaction is assignable to NodePgDatabase.
async function hasRecordedDeletion(
  db: NodePgDatabase,
  signupUserId: SignupUserId,
): Promise<boolean> {
  const [existing] = await db
    .select({ signupUserId: deletedSignupUser.signupUserId })
    .from(deletedSignupUser)
    .where(eq(deletedSignupUser.signupUserId, signupUserId))
    .limit(1);
  return existing !== undefined;
}
