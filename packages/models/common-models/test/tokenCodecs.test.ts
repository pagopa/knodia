import { describe, expect, it } from "vitest";

import { selectSignupIdentifier } from "../src/auth/tokenCodecs.ts";

describe("selectSignupIdentifier", () => {
  it("prefers spidCode over fiscalNumber (a SPID login carries both)", () => {
    expect(
      selectSignupIdentifier({
        fiscalNumber: "RSSMRA80A01H501U",
        spidCode: "spid-code-123",
      }),
    ).toEqual({ field: "spidCode", value: "spid-code-123" });
  });

  it("keeps fiscalNumber for a CIE login (only fiscalNumber present)", () => {
    expect(
      selectSignupIdentifier({ fiscalNumber: "RSSMRA80A01H501U" }),
    ).toEqual({ field: "fiscalNumber", value: "RSSMRA80A01H501U" });
  });

  it("returns undefined when no identifier is present", () => {
    expect(selectSignupIdentifier({})).toBeUndefined();
  });
});
