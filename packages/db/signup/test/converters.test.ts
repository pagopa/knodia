import { generateId, type SignupUserId } from "@knodia/common-models/ids";
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
    fiscalNumber: "RSSMRA80A01H501U",
    lynxOrganizationName: "Lynx Org",
    lynxUserName: "lynx_user",
    name: "Mario",
    orionOrganizationName: "Orion Org",
    orionUserName: "orion_user",
    personIdentifier: null,
    signupUserId: generateId<SignupUserId>(),
    spidCode: "SPID-XYZ-1",
    status: "Active",
    updatedAt: new Date("2026-05-28T10:00:00Z"),
    ...overrides,
  };
}

describe("toSignupUser", () => {
  it("maps a fully populated row, nesting per-knode columns under generatedEntities", () => {
    const row = baseRow();
    const user = toSignupUser(row);

    expect(user).toMatchObject({
      fiscalNumber: "RSSMRA80A01H501U",
      generatedEntities: {
        Lynx: { organizationName: "Lynx Org", userName: "lynx_user" },
        Orion: { organizationName: "Orion Org", userName: "orion_user" },
      },
      signupUserId: row.signupUserId,
    });
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
