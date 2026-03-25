import { describe, expect, it } from "vitest";

import { unsafeBrandUserId, UserId } from "../src/ids/userId.ts";

const RFC_4122_UUID = "550e8400-e29b-41d4-a716-446655440000";
const COGNITO_SUB = "9324e892-6081-703b-4b2f-1f007ecd0b0c";

describe("UserId", () => {
  it("should accept a standard RFC 4122 UUID", () => {
    expect(UserId.safeParse(RFC_4122_UUID).success).toBe(true);
  });

  it("should accept a Cognito sub that doesn't conform to RFC 4122 variant bits", () => {
    expect(UserId.safeParse(COGNITO_SUB).success).toBe(true);
  });

  it("should reject an invalid string", () => {
    expect(UserId.safeParse("not-a-uuid").success).toBe(false);
  });
});

describe("unsafeBrandUserId", () => {
  it("should accept a standard RFC 4122 UUID", () => {
    expect(() => unsafeBrandUserId(RFC_4122_UUID)).not.toThrow();
  });

  it("should accept a Cognito sub that doesn't conform to RFC 4122 variant bits", () => {
    expect(() => unsafeBrandUserId(COGNITO_SUB)).not.toThrow();
  });

  it("should reject an invalid string", () => {
    expect(() => unsafeBrandUserId("not-valid")).toThrow();
  });
});
