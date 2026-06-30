import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import {
  SignupUser,
  SignupUserStatus,
  SuspensionReason,
} from "@knodia/signup-models";

import { signupDbService } from "./setup.ts";

export async function seedSuspendedUser(
  suspendedAt: Date,
  overrides: Record<string, unknown> = {},
): Promise<SignupUser> {
  return seedUser({
    status: SignupUserStatus.enum.Suspended,
    suspendedAt,
    suspensionReason: SuspensionReason.enum.AccuracyContested,
    ...overrides,
  });
}

export async function seedUser(
  overrides: Record<string, unknown> = {},
): Promise<SignupUser> {
  const user = makeUser(overrides);
  await signupDbService.insertSignupUser(user);
  return user;
}

// Each user needs unique email/org/user names and exactly one identifier (DB
// unique + single-identifier constraints). Built via parse to validate the union.
function makeUser(overrides: Record<string, unknown> = {}): SignupUser {
  const id = generateId<SignupUserId>();
  return SignupUser.parse({
    createdAt: new Date("2026-01-01T00:00:00Z"),
    dateOfBirth: "1980-01-15",
    email: `${id}@example.test`,
    familyName: "Rossi",
    fiscalNumber: `FN-${id}`,
    generatedEntities: {
      Lynx: { organizationName: `Lynx ${id}`, userName: `lynx_${id}` },
      Orion: { organizationName: `Orion ${id}`, userName: `orion_${id}` },
    },
    name: "Mario",
    signupUserId: id,
    status: SignupUserStatus.enum.Active,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  });
}
