import type { SignupUser } from "@knodia/signup-models";

import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { signupUser } from "@knodia/db-signup";
import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import {
  getTestUISignupSessionTokenClaims,
  type TestToken,
} from "@knodia/test-commons/auth";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import { app, signupDb } from "./setup.ts";

export const validConfirmOnboardingBody = {
  email: "test.user@example.com",
};

export const validUISignupSessionTokenClaims =
  getTestUISignupSessionTokenClaims();

export async function getAllSignupUsers() {
  return await signupDb.select().from(signupUser);
}

export function injectSignupAppRequest(
  token: TestToken = { oneIdNonce: "test-nonce", type: "ui-signup-session" },
) {
  return createInjectAppRequest(() => app)(token);
}

export function makeSignupUser(
  overrides: Partial<SignupUser> = {},
): SignupUser {
  const seed = overrides.signupUserId ?? generateId<SignupUserId>();

  return {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
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
    status: "Active",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export async function seedSignupUser(user: SignupUser) {
  await signupDbServiceBuilder(signupDb).insertSignupUser(user);
}
