import type { TestDrizzleDb } from "@knodia/test-commons/types";

import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import {
  SignupUser,
  SignupUserStatus,
  SuspensionReason,
} from "@knodia/signup-models";
import { setupSignupTestDatabase } from "@knodia/test-commons/signupDb";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  inject,
  it,
} from "vitest";

import {
  type SignupDbService,
  signupDbServiceBuilder,
} from "../src/services/signupDbService.ts";
import { signupUser } from "../src/signupUser.ts";

let db: TestDrizzleDb;
let service: SignupDbService;

beforeAll(async () => {
  db = await setupSignupTestDatabase(inject("POSTGRES_CONNECTION_STRING"));
  service = signupDbServiceBuilder(db);
});

afterEach(async () => {
  await resetTestDatabase(db, signupUser);
});

afterAll(async () => {
  await db.$client.end();
});

function makeSuspendedUser(
  suspendedAt: Date,
  overrides: Record<string, unknown> = {},
): SignupUser {
  return makeUser({
    status: SignupUserStatus.enum.Suspended,
    suspendedAt,
    suspensionReason: SuspensionReason.enum.AccuracyContested,
    ...overrides,
  });
}

// Each user needs globally-unique email / org / user names and exactly one
// identifier (DB unique + single-identifier constraints). Built via parse so
// the discriminated union is reconstructed and validated.
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

describe("listSuspendedSignupUsers", () => {
  it("returns only Suspended users, ordered by suspendedAt desc", async () => {
    const older = makeSuspendedUser(new Date("2026-02-01T10:00:00Z"));
    const newer = makeSuspendedUser(new Date("2026-03-01T10:00:00Z"));
    const active = makeUser({ status: SignupUserStatus.enum.Active });
    const deletionPending = makeUser({
      status: SignupUserStatus.enum.DeletionPending,
    });

    for (const user of [older, active, newer, deletionPending]) {
      await service.insertSignupUser(user);
    }

    const result = await service.listSuspendedSignupUsers();

    expect(result.map((u) => u.signupUserId)).toEqual([
      newer.signupUserId,
      older.signupUserId,
    ]);
    expect(
      result.every((u) => u.status === SignupUserStatus.enum.Suspended),
    ).toBe(true);
  });

  it("returns an empty list when there are no Suspended users", async () => {
    await service.insertSignupUser(
      makeUser({ status: SignupUserStatus.enum.Active }),
    );
    await service.insertSignupUser(
      makeUser({ status: SignupUserStatus.enum.DeletionPending }),
    );

    expect(await service.listSuspendedSignupUsers()).toEqual([]);
  });
});
