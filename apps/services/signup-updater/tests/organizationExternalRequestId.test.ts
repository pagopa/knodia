import { type SignupUserId, unsafeBrandId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { organizationExternalRequestId } from "../src/utils/organizationExternalRequestId.ts";

const signupUserId = unsafeBrandId<SignupUserId>(
  "11111111-1111-4111-8111-111111111111",
);

describe("organizationExternalRequestId", () => {
  // Pinned vectors: guard the hand-rolled v5 implementation and the namespace.
  it("is a deterministic v5 UUID per Knode", () => {
    expect(organizationExternalRequestId(signupUserId, "Orion")).toBe(
      "a5a66eef-49e1-5a4c-81f8-6841edafdc2e",
    );
    expect(organizationExternalRequestId(signupUserId, "Lynx")).toBe(
      "44318656-0134-5227-a218-9cfb8422ad0a",
    );
  });

  it("differs per Knode for the same signup user", () => {
    expect(organizationExternalRequestId(signupUserId, "Orion")).not.toBe(
      organizationExternalRequestId(signupUserId, "Lynx"),
    );
  });
});
