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
import { match } from "ts-pattern";

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

    async listSuspendedSignupUsers(): Promise<
      Extract<SignupUser, { status: "Suspended" }>[]
    > {
      const results = await db
        .select()
        .from(signupUser)
        .where(eq(signupUser.status, SignupUserStatus.enum.Suspended))
        .orderBy(desc(signupUser.suspendedAt));
      // toSignupUser parses the full union; narrow to match the query's filter.
      return results.map(toSignupUser).map((user) =>
        match(user)
          .with({ status: SignupUserStatus.enum.Suspended }, (u) => u)
          .with(
            { status: SignupUserStatus.enum.Active },
            { status: SignupUserStatus.enum.OnboardingPending },
            { status: SignupUserStatus.enum.DeletionPending },
            () => {
              throw genericInternalError(
                "listSuspendedSignupUsers returned a non-Suspended user",
              );
            },
          )
          .exhaustive(),
      );
    },

    async markSignupUserActive(signupUserId: SignupUserId): Promise<void> {
      await transitionSignupUserStatus(db, {
        // Present non-pending row is already past onboarding: no-op.
        acceptsExistingStatus: () => true,
        from: [SignupUserStatus.enum.OnboardingPending],
        signupUserId,
        to: SignupUserStatus.enum.Active,
      });
    },

    async markSignupUserDeletionPending(
      signupUserId: SignupUserId,
    ): Promise<void> {
      await transitionSignupUserStatus(db, {
        // DeletionPending is an idempotent retry; any other status throws.
        acceptsExistingStatus: (status) =>
          status === SignupUserStatus.enum.DeletionPending,
        clearSuspension: true,
        from: [
          SignupUserStatus.enum.OnboardingPending,
          SignupUserStatus.enum.Active,
          SignupUserStatus.enum.Suspended,
        ],
        signupUserId,
        to: SignupUserStatus.enum.DeletionPending,
      });
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

    async updateSignupUserReactivation(
      signupUserId: SignupUserId,
    ): Promise<void> {
      await transitionSignupUserStatus(db, {
        // Already Active is an idempotent retry; any other status throws.
        acceptsExistingStatus: (status) =>
          status === SignupUserStatus.enum.Active,
        clearSuspension: true,
        from: [SignupUserStatus.enum.Suspended],
        signupUserId,
        to: SignupUserStatus.enum.Active,
      });
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

/**
 * Race-safe status transition: a conditional UPDATE guarded on `from`. When no row
 * matched, a present row is a no-op if `acceptsExistingStatus` allows it, a missing
 * row is a no-op once the deletion completed, else it throws.
 */
async function transitionSignupUserStatus(
  db: NodePgDatabase,
  {
    acceptsExistingStatus,
    clearSuspension = false,
    from,
    signupUserId,
    to,
  }: {
    acceptsExistingStatus: (status: string) => boolean;
    clearSuspension?: boolean;
    from: SignupUserStatus[];
    signupUserId: SignupUserId;
    to: SignupUserStatus;
  },
): Promise<void> {
  const [updated] = await db
    .update(signupUser)
    .set({
      status: to,
      updatedAt: new Date(),
      ...(clearSuspension ? { suspendedAt: null, suspensionReason: null } : {}),
    })
    .where(
      and(
        eq(signupUser.signupUserId, signupUserId),
        inArray(signupUser.status, from),
      ),
    )
    .returning({ signupUserId: signupUser.signupUserId });

  if (updated) {
    return;
  }

  const [existing] = await db
    .select({ status: signupUser.status })
    .from(signupUser)
    .where(eq(signupUser.signupUserId, signupUserId))
    .limit(1);

  if (existing) {
    if (acceptsExistingStatus(existing.status)) {
      return;
    }
  } else if (await hasRecordedDeletion(db, signupUserId)) {
    return;
  }

  throw genericInternalError(
    `Cannot transition signup user ${signupUserId} to ${to}: user ${existing ? `has status ${existing.status}` : "not found"}`,
  );
}
