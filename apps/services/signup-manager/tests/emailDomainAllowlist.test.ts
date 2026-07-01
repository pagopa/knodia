import { describe, expect, it } from "vitest";

import { isEmailDomainAllowed } from "../src/utils/emailDomainAllowlist.ts";

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

  it("rejects a subdomain of an allowed domain (exact match only)", () => {
    expect(isEmailDomainAllowed("mario@mail.pagopa.it", ["pagopa.it"])).toBe(
      false,
    );
  });

  it("rejects a domain not in the allowlist", () => {
    expect(
      isEmailDomainAllowed("mario@example.com", ["pagopa.it", "mail.pagopa.it"]),
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
