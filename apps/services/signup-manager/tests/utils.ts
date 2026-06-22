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
  suspensionReason: "UNLAWFUL_PROCESSING",
} as const;

export const validUISignupSessionTokenClaims =
  getTestUISignupSessionTokenClaims();

// A signup user carries exactly one identifier. Each member forbids the other
// two keys via `never`, so passing more than one is a compile error; identifiers
// go through this param, not through `overrides`.
type SignupUserIdentifier =
  | {
      fiscalNumber: string | undefined;
      personIdentifier?: never;
      spidCode?: never;
    }
  | {
      fiscalNumber?: never;
      personIdentifier: string | undefined;
      spidCode?: never;
    }
  | {
      fiscalNumber?: never;
      personIdentifier?: never;
      spidCode: string | undefined;
    };

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
  identifier?: SignupUserIdentifier,
): SignupUser {
  const seed = overrides.signupUserId ?? generateId<SignupUserId>();
  const baseDate = new Date("2026-01-01T00:00:00.000Z");

  // Suspension fields live only on the Suspended branch of the union; read them
  // off overrides here so the match below can apply them (defaulted when absent).
  const { suspendedAt, suspensionReason } = overrides as Partial<
    Extract<SignupUser, { status: typeof SignupUserStatus.enum.Suspended }>
  >;

  // Identifiers normally come via the `identifier` param, but `overrides` is a
  // Partial<SignupUser> so it can carry them too; don't add the default spidCode
  // on top of one the caller already set there, or the row would carry two.
  const overridesHasIdentifier =
    "spidCode" in overrides ||
    "fiscalNumber" in overrides ||
    "personIdentifier" in overrides;

  const base = {
    createdAt: baseDate,
    dateOfBirth: "1990-01-01",
    email: `seed-${seed}@example.com`,
    familyName: "Seed",
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
    updatedAt: baseDate,
    ...overrides,
    // Exactly one identifier: default to a SPID login only when the caller picks
    // none (neither the identifier param nor an identifier in overrides).
    ...(identifier ??
      (overridesHasIdentifier ? {} : { spidCode: `SPID-${seed}` })),
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
      suspendedAt: suspendedAt ?? baseDate,
      suspensionReason:
        suspensionReason ?? SuspensionReason.enum.UnlawfulProcessing,
    }))
    .exhaustive();
}

export async function seedEmailChangeRequest(request: EmailChangeRequest) {
  await signupDbServiceBuilder(signupDb).insertEmailChangeRequest(request);
}

export async function seedSignupUser(user: SignupUser) {
  await signupDbServiceBuilder(signupDb).insertSignupUser(user);
}
