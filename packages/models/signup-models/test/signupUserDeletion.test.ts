import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { SignupUserDeletion } from "../src/signupUserDeletion.ts";

const baseRecord = {
  deletedAt: new Date("2026-06-01T10:00:05Z"),
  deletionRequestedAt: new Date("2026-06-01T10:00:00Z"),
  signupCreatedAt: new Date("2026-05-28T10:00:00Z"),
  signupUserId: generateId<SignupUserId>(),
};

describe("SignupUserDeletion", () => {
  it("accepts a registry entry and coerces ISO strings to dates", () => {
    const parsed = SignupUserDeletion.parse({
      ...baseRecord,
      deletedAt: "2026-06-01T10:00:05Z",
    });
    expect(parsed.deletedAt).toEqual(new Date("2026-06-01T10:00:05Z"));
  });

  it("rejects extra keys (strictObject): the registry must stay PII-free", () => {
    expect(() =>
      SignupUserDeletion.parse({ ...baseRecord, email: "x@example.org" }),
    ).toThrow();
  });
});
