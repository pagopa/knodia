import {
  type EmailChangeRequestId,
  generateId,
  type SignupUserId,
} from "@knodia/common-models/ids";
import { emailChangeRequest, signupUser } from "@knodia/db-signup";
import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import {
  type EmailChangeRequest,
  type SignupUser,
  SignupUserStatus,
  SuspensionReason,
} from "@knodia/signup-models";
import {
  getTestUISignupSessionTokenClaims,
  type TestToken,
} from "@knodia/test-commons/auth";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import { match } from "ts-pattern";

import { app, signupDb } from "./setup.ts";

export const validConfirmOnboardingBody = {
  email: "test.user@example.com",
};

export const validChangeEmailBody = {
  email: "new.email@example.com",
};

export const validSuspendUserBody = {
  reason: "UnlawfulProcessing",
} as const;

export const validUISignupSessionTokenClaims =
  getTestUISignupSessionTokenClaims();

export async function getAllEmailChangeRequests() {
  return await signupDb.select().from(emailChangeRequest);
}

export async function getAllSignupUsers() {
  return await signupDb.select().from(signupUser);
}

export function injectSignupAppRequest(
  token: TestToken = { oneIdNonce: "test-nonce", type: "ui-signup-session" },
) {
  return createInjectAppRequest(() => app)(token);
}

export function makeEmailChangeRequest(
  overrides: Partial<EmailChangeRequest> = {},
): EmailChangeRequest {
  const signupUserId = overrides.signupUserId ?? generateId<SignupUserId>();

  return {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    email: `email-change-${signupUserId}@example.com`,
    emailChangeRequestId:
      overrides.emailChangeRequestId ?? generateId<EmailChangeRequestId>(),
    signupUserId,
    ...overrides,
  };
}

export function makeSignupUser(
  overrides: Partial<SignupUser> = {},
): SignupUser {
  const seed = overrides.signupUserId ?? generateId<SignupUserId>();
  const baseCreatedAt = new Date("2026-01-01T00:00:00.000Z");
  const baseUpdatedAt = new Date("2026-01-01T00:00:00.000Z");

  const base = {
    createdAt: baseCreatedAt,
    dateOfBirth: "1990-01-01",
    email: `seed-${seed}@example.com`,
    familyName: "Seed",
    fiscalNumber: `FISCAL-${seed}`,
    generatedEntities: {
      Lynx: {
        organizationName: `Lynx Seed ${seed}`,
        userName: `lynx_seed_${seed}`,
      },
      Orion: {
        organizationName: `Orion Seed ${seed}`,
        userName: `orion_seed_${seed}`,
      },
    },
    name: "Seed",
    signupUserId: seed,
    spidCode: `SPID-${seed}`,
    updatedAt: baseUpdatedAt,
    ...overrides,
  };

  return match(overrides.status ?? SignupUserStatus.enum.Active)
    .returnType<SignupUser>()
    .with(
      SignupUserStatus.enum.Active,
      SignupUserStatus.enum.DeletionPending,
      (status) => ({ ...base, status }),
    )
    .with(SignupUserStatus.enum.Suspended, (status) => ({
      ...base,
      status,
      suspendedAt: baseUpdatedAt,
      suspensionReason: SuspensionReason.enum.UnlawfulProcessing,
    }))
    .exhaustive();
}

export async function seedEmailChangeRequest(request: EmailChangeRequest) {
  await signupDbServiceBuilder(signupDb).insertEmailChangeRequest(request);
}

export async function seedSignupUser(user: SignupUser) {
  await signupDbServiceBuilder(signupDb).insertSignupUser(user);
}
