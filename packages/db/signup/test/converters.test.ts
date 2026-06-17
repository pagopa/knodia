import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import type { SignupUserSQL } from "../src/signupUser.ts";

import { toSignupUser, toSignupUserSQL } from "../src/converters/converters.ts";

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
    suspendedAt: null,
    suspensionReason: null,
    updatedAt: new Date("2026-05-28T10:00:00Z"),
    ...overrides,
  };
}

describe("toSignupUser", () => {
  it("maps a fully populated row, nesting per-knode columns under generatedEntities", () => {
    const row = baseRow();
    const user = toSignupUser(row);

    expect(user.signupUserId).toBe(row.signupUserId);
    expect(user.fiscalNumber).toBe("RSSMRA80A01H501U");
    expect(user.generatedEntities.Lynx).toEqual({
      organizationName: "Lynx Org",
      userName: "lynx_user",
    });
    expect(user.generatedEntities.Orion.organizationName).toBe("Orion Org");
  });

  it("coerces NULL optional columns to undefined", () => {
    const user = toSignupUser(
      baseRow({
        fiscalNumber: null,
        personIdentifier: null,
        spidCode: "SPID-ONLY",
      }),
    );

    expect(user.fiscalNumber).toBeUndefined();
    expect(user.personIdentifier).toBeUndefined();
    expect(user.spidCode).toBe("SPID-ONLY");
  });

  it("maps suspension fields when row is suspended", () => {
    const suspendedAt = new Date("2026-05-30T09:00:00Z");
    const user = toSignupUser(
      baseRow({
        status: "Suspended",
        suspendedAt,
        suspensionReason: "AccuracyContested",
      }),
    );

    expect(user.status).toBe("Suspended");
    expect(user.suspendedAt).toEqual(suspendedAt);
    expect(user.suspensionReason).toBe("AccuracyContested");
  });

  it("throws when the row carries no IdP identifier", () => {
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
        status: "Suspended",
        suspendedAt,
        suspensionReason: "UnlawfulProcessing",
      }),
    );
    const sql = toSignupUserSQL(user);

    expect(sql.status).toBe("Suspended");
    expect(sql.suspendedAt).toEqual(suspendedAt);
    expect(sql.suspensionReason).toBe("UnlawfulProcessing");
  });
});
