import { describe, expect, it } from "vitest";

import {
  AllowedEmailDomainsSchema,
  isEmailDomainAllowed,
} from "../src/utils/emailDomainAllowlist.ts";

describe("isEmailDomainAllowed", () => {
  it("allows any email when the allowlist is the `any` sentinel", () => {
    expect(isEmailDomainAllowed("whoever@example.com", "any")).toBe(true);
  });

  it("allows an email whose domain is an exact match", () => {
    expect(isEmailDomainAllowed("mario@pagopa.it", ["pagopa.it"])).toBe(true);
  });

  it("matches the domain case-insensitively", () => {
    expect(isEmailDomainAllowed("Mario.Rossi@PagoPA.IT", ["pagopa.it"])).toBe(
      true,
    );
  });

  it("matches case-insensitively against an uppercase allowlist entry", () => {
    expect(isEmailDomainAllowed("mario@pagopa.it", ["PagoPA.IT"])).toBe(true);
  });

  it("rejects a subdomain of an allowed domain (exact match only)", () => {
    expect(isEmailDomainAllowed("mario@mail.pagopa.it", ["pagopa.it"])).toBe(
      false,
    );
  });

  it("rejects a domain not in the allowlist", () => {
    expect(
      isEmailDomainAllowed("mario@example.com", [
        "pagopa.it",
        "mail.pagopa.it",
      ]),
    ).toBe(false);
  });

  it("uses the part after the last @", () => {
    expect(isEmailDomainAllowed("weird@local@pagopa.it", ["pagopa.it"])).toBe(
      true,
    );
  });

  it("rejects a malformed email with no domain", () => {
    expect(isEmailDomainAllowed("not-an-email", ["pagopa.it"])).toBe(false);
    expect(isEmailDomainAllowed("trailing@", ["pagopa.it"])).toBe(false);
  });
});

describe("AllowedEmailDomainsSchema", () => {
  it("parses the `any` sentinel", () => {
    expect(AllowedEmailDomainsSchema.parse("any")).toBe("any");
    expect(AllowedEmailDomainsSchema.parse(" ANY ")).toBe("any");
  });

  it("parses and normalizes a comma-separated list", () => {
    expect(AllowedEmailDomainsSchema.parse("PagoPA.IT, buildo.com")).toEqual([
      "pagopa.it",
      "buildo.com",
    ]);
  });

  it("rejects an empty value", () => {
    expect(AllowedEmailDomainsSchema.safeParse("").success).toBe(false);
    expect(AllowedEmailDomainsSchema.safeParse("  ").success).toBe(false);
  });

  it("rejects a list containing a non-domain entry", () => {
    expect(AllowedEmailDomainsSchema.safeParse("buildo.com,asd").success).toBe(
      false,
    );
  });

  it("rejects `any` mixed into a list (ambiguous)", () => {
    expect(AllowedEmailDomainsSchema.safeParse("buildo.com,any").success).toBe(
      false,
    );
  });
});
