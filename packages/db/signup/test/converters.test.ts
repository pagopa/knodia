import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { type SignupUser, SignupUserStatus } from "@knodia/signup-models";
import { describe, expect, it } from "vitest";

import type { DeletedSignupUserSQL, SignupUserSQL } from "../src/signupUser.ts";

import {
  toDeletedSignupUserSQL,
  toSignupUser,
  toSignupUserDeletion,
  toSignupUserSQL,
} from "../src/converters/converters.ts";

function baseRow(overrides: Partial<SignupUserSQL> = {}): SignupUserSQL {
  return {
    createdAt: new Date("2026-05-28T10:00:00Z"),
    dateOfBirth: "1980-01-01",
    email: "mario.rossi@example.org",
    familyName: "Rossi",
    fiscalNumber: null,
    lynxOrganizationName: "Lynx Org",
    lynxUserName: "lynx_user",
    name: "Mario",
    orionOrganizationName: "Orion Org",
    orionUserName: "orion_user",
    personIdentifier: null,
    signupUserId: generateId<SignupUserId>(),
    spidCode: "SPID-XYZ-1",
    status: SignupUserStatus.enum.Active,
    suspendedAt: null,
    suspensionReason: null,
    termsAcceptedAt: new Date("2026-05-28T10:00:00Z"),
    termsAcceptedVersion: 1,
    updatedAt: new Date("2026-05-28T10:00:00Z"),
    ...overrides,
  };
}

describe("toSignupUser", () => {
  it("maps a row, nesting per-knode columns under generatedEntities", () => {
    const row = baseRow();
    const user = toSignupUser(row);

    expect(user).toMatchObject({
      generatedEntities: {
        Lynx: { organizationName: "Lynx Org", userName: "lynx_user" },
        Orion: { organizationName: "Orion Org", userName: "orion_user" },
      },
      signupUserId: row.signupUserId,
      spidCode: "SPID-XYZ-1",
      termsAcceptedAt: row.termsAcceptedAt,
    });
  });

  it("round-trips termsAcceptedAt through SQL and back", () => {
    const termsAcceptedAt = new Date("2026-04-02T07:15:00Z");
    const user = toSignupUser(baseRow({ termsAcceptedAt }));
    expect(user.termsAcceptedAt).toEqual(termsAcceptedAt);
    expect(toSignupUserSQL(user).termsAcceptedAt).toEqual(termsAcceptedAt);
  });

  it("round-trips termsAcceptedVersion through SQL and back", () => {
    const user = toSignupUser(baseRow({ termsAcceptedVersion: 3 }));
    expect(user.termsAcceptedVersion).toBe(3);
    expect(toSignupUserSQL(user).termsAcceptedVersion).toBe(3);
  });

  it("coerces NULL optional columns to undefined", () => {
    const user = toSignupUser(
      baseRow({
        fiscalNumber: null,
        personIdentifier: null,
        spidCode: "SPID-ONLY",
      }),
    );

    expect(user).toMatchObject({
      fiscalNumber: undefined,
      personIdentifier: undefined,
      spidCode: "SPID-ONLY",
    });
  });

  it("maps suspension fields when row is suspended", () => {
    const suspendedAt = new Date("2026-05-30T09:00:00Z");
    const user = toSignupUser(
      baseRow({
        status: SignupUserStatus.enum.Suspended,
        suspendedAt,
        suspensionReason: "AccuracyContested",
      }),
    ) as Extract<
      SignupUser,
      { status: typeof SignupUserStatus.enum.Suspended }
    >;

    expect(user.status).toBe(SignupUserStatus.enum.Suspended);
    expect(user.suspendedAt).toEqual(suspendedAt);
    expect(user.suspensionReason).toBe("AccuracyContested");
  });

  it("throws when a row carries no IdP identifier", () => {
    expect(() =>
      toSignupUser(
        baseRow({ fiscalNumber: null, personIdentifier: null, spidCode: null }),
      ),
    ).toThrow();
  });
});

describe("toSignupUserSQL", () => {
  it("flattens generatedEntities back into per-knode columns", () => {
    const user = toSignupUser(baseRow());
    const sql = toSignupUserSQL(user);

    expect(sql.signupUserId).toBe(user.signupUserId);
    expect(sql.orionOrganizationName).toBe("Orion Org");
  });

  it("keeps suspension fields when flattening to SQL", () => {
    const suspendedAt = new Date("2026-05-30T09:00:00Z");
    const user = toSignupUser(
      baseRow({
        status: SignupUserStatus.enum.Suspended,
        suspendedAt,
        suspensionReason: "UnlawfulProcessing",
      }),
    );
    const sql = toSignupUserSQL(user);

    expect(sql.status).toBe(SignupUserStatus.enum.Suspended);
    expect(sql.suspendedAt).toEqual(suspendedAt);
    expect(sql.suspensionReason).toBe("UnlawfulProcessing");
  });
});

function deletionRow(
  overrides: Partial<DeletedSignupUserSQL> = {},
): DeletedSignupUserSQL {
  return {
    deletedAt: new Date("2026-06-01T10:00:05Z"),
    signupUserId: generateId<SignupUserId>(),
    ...overrides,
  };
}

describe("toSignupUserDeletion / toDeletedSignupUserSQL", () => {
  it("round-trips a deletion registry entry", () => {
    const row = deletionRow();
    const deletion = toSignupUserDeletion(row);

    expect(toDeletedSignupUserSQL(deletion)).toEqual(row);
  });
});
