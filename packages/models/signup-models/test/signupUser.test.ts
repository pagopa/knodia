import { describe, expect, it } from "vitest";

import { generateSignupUserId, SignupUser } from "../src/signupUser.ts";

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
  signupUserId: generateSignupUserId(),
  spidCode: "SPID-XYZ-1",
  status: "ACTIVE" as const,
  updatedAt: new Date("2026-05-28T10:00:00Z"),
};

describe("SignupUser — happy paths", () => {
  it("accepts a SPID token carrying both spidCode and fiscalNumber", () => {
    const parsed = SignupUser.parse(baseRecord);
    expect(parsed.spidCode).toBe("SPID-XYZ-1");
    expect(parsed.fiscalNumber).toBe("RSSMRA80A01H501U");
  });

  it("accepts an eIDAS-only record (only personIdentifier set)", () => {
    const parsed = SignupUser.parse({
      ...baseRecord,
      fiscalNumber: undefined,
      personIdentifier: "FR/IT/12345",
      spidCode: undefined,
    });
    expect(parsed.personIdentifier).toBe("FR/IT/12345");
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
