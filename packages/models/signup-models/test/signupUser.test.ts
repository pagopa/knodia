import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { SignupUser, type SignupUserStatus } from "../src/signupUser.ts";

const baseRecord = {
  createdAt: new Date("2026-05-28T10:00:00Z"),
  dateOfBirth: "1980-01-01",
  email: "mario.rossi@example.org",
  familyName: "Rossi",
  fiscalNumber: "RSSMRA80A01H501U",
  generatedEntities: {
    Lynx: { organizationName: "Vega 9PD Org", userName: "vega_9pd_user" },
    Orion: { organizationName: "Rigel XA1 Org", userName: "rigel_xa1_user" },
  },
  name: "Mario",
  signupUserId: generateId<SignupUserId>(),
  spidCode: "SPID-XYZ-1",
  status: "Active" as SignupUserStatus,
  updatedAt: new Date("2026-05-28T10:00:00Z"),
};

describe("SignupUser — happy paths", () => {
  it("accepts a SPID token carrying both spidCode and fiscalNumber", () => {
    const parsed = SignupUser.parse(baseRecord);
    expect(parsed).toMatchObject({
      fiscalNumber: "RSSMRA80A01H501U",
      spidCode: "SPID-XYZ-1",
    });
  });

  it("accepts an eIDAS-only record (only personIdentifier set)", () => {
    const parsed = SignupUser.parse({
      ...baseRecord,
      fiscalNumber: undefined,
      personIdentifier: "FR/IT/12345",
      spidCode: undefined,
    });
    expect(parsed).toMatchObject({ personIdentifier: "FR/IT/12345" });
  });

  it("accepts a DeletionPending record with the same shape as Active", () => {
    const parsed = SignupUser.parse({
      ...baseRecord,
      status: "DeletionPending",
    });
    expect(parsed.status).toBe("DeletionPending");
  });

  it("accepts a suspended user with reason and timestamp", () => {
    const parsed = SignupUser.parse({
      ...baseRecord,
      status: "Suspended",
      suspendedAt: new Date("2026-05-30T09:00:00Z"),
      suspensionReason: "DataNeededForLegalClaims",
    });

    expect(parsed.status).toBe("Suspended");
    expect(parsed.suspensionReason).toBe("DataNeededForLegalClaims");
  });
});

describe("SignupUser — shape rejections", () => {
  it("rejects a malformed email", () => {
    expect(() =>
      SignupUser.parse({ ...baseRecord, email: "not-an-email" }),
    ).toThrow();
  });

  it("rejects an unknown status", () => {
    expect(() =>
      SignupUser.parse({ ...baseRecord, status: "DEACTIVATED" }),
    ).toThrow();
  });

  it("rejects the Deleted status: completed deletions live in the registry, not as user rows", () => {
    expect(() =>
      SignupUser.parse({ ...baseRecord, status: "Deleted" }),
    ).toThrow();
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    expect(() =>
      SignupUser.parse({ ...baseRecord, dateOfBirth: "1980/01/01" }),
    ).toThrow();
  });

  it("rejects extra unknown keys (strictObject)", () => {
    expect(() =>
      SignupUser.parse({ ...baseRecord, weirdExtraField: "x" }),
    ).toThrow();
  });

  it("rejects suspended status without suspension fields", () => {
    expect(() =>
      SignupUser.parse({
        ...baseRecord,
        status: "Suspended",
      }),
    ).toThrow();
  });

  it("rejects active status with suspension fields set", () => {
    expect(() =>
      SignupUser.parse({
        ...baseRecord,
        status: "Active",
        suspendedAt: new Date("2026-05-30T09:00:00Z"),
        suspensionReason: "AccuracyContested",
      }),
    ).toThrow();
  });
});

describe("SignupUser — at-least-one-identifier invariant", () => {
  it("rejects when no IdP identifier is set", () => {
    expect(() =>
      SignupUser.parse({
        ...baseRecord,
        fiscalNumber: undefined,
        personIdentifier: undefined,
        spidCode: undefined,
      }),
    ).toThrow();
  });
});
