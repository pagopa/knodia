import { type SignupUserId, unsafeBrandId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { organizationExternalRequestId } from "../src/utils/organizationExternalRequestId.ts";

const signupUserId = unsafeBrandId<SignupUserId>(
  "11111111-1111-4111-8111-111111111111",
);

describe("organizationExternalRequestId", () => {
  // Pinned vectors: guard the namespace and v5 derivation so the idempotency
  // key never changes silently across refactors.
  it("is a deterministic v5 UUID per Knode", () => {
    expect(organizationExternalRequestId(signupUserId, "Orion")).toBe(
      "87bf0677-74ae-59a0-965b-ed54739772ef",
    );
    expect(organizationExternalRequestId(signupUserId, "Lynx")).toBe(
      "213edb3c-1ba1-512d-a9c3-356f4d3fdb94",
    );
  });

  it("differs per Knode for the same signup user", () => {
    expect(organizationExternalRequestId(signupUserId, "Orion")).not.toBe(
      organizationExternalRequestId(signupUserId, "Lynx"),
    );
  });
});
