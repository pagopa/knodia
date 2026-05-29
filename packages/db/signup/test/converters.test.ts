import {
  generateId,
  type OrganizationId,
  type SignupUserId,
} from "@knodia/common-models/ids";
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
    lynxOrganizationId: generateId<OrganizationId>(),
    lynxOrganizationName: "Lynx Org",
    lynxUserName: "lynx_user",
    name: "Mario",
    orionOrganizationId: generateId<OrganizationId>(),
    orionOrganizationName: "Orion Org",
    orionUserName: "orion_user",
    personIdentifier: null,
    signupUserId: generateId<SignupUserId>(),
    spidCode: "SPID-XYZ-1",
    status: "ACTIVE",
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
      organizationId: row.lynxOrganizationId,
      organizationName: "Lynx Org",
      userName: "lynx_user",
    });
    expect(user.generatedEntities.Orion.organizationId).toBe(
      row.orionOrganizationId,
    );
  });

  it("coerces NULL optional columns to undefined (org IDs included)", () => {
    const user = toSignupUser(
      baseRow({
        fiscalNumber: null,
        lynxOrganizationId: null,
        orionOrganizationId: null,
        personIdentifier: null,
        spidCode: "SPID-ONLY",
      }),
    );

    expect(user.generatedEntities.Lynx.organizationId).toBeUndefined();
    expect(user.generatedEntities.Orion.organizationId).toBeUndefined();
    expect(user.fiscalNumber).toBeUndefined();
    expect(user.personIdentifier).toBeUndefined();
    expect(user.spidCode).toBe("SPID-ONLY");
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
    expect(sql.lynxOrganizationId).toBe(
      user.generatedEntities.Lynx.organizationId,
    );
    expect(sql.orionOrganizationName).toBe("Orion Org");
  });

  it("leaves absent optional org IDs undefined", () => {
    const user = toSignupUser(
      baseRow({
        fiscalNumber: null,
        lynxOrganizationId: null,
        orionOrganizationId: null,
        personIdentifier: null,
        spidCode: "SPID-ONLY",
      }),
    );
    const sql = toSignupUserSQL(user);

    expect(sql.lynxOrganizationId).toBeUndefined();
    expect(sql.orionOrganizationId).toBeUndefined();
  });
});
