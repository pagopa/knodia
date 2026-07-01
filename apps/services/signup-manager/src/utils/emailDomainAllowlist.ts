import { z } from "zod";

// `any` disables the gate (used locally and once onboarding opens to everyone).
const ALLOW_ALL = "any";

export type AllowedEmailDomains = string[] | typeof ALLOW_ALL;

// No `z.domain()` schema exists, and `z.hostname()` allows bare labels
// (`asd`, `any`); this stricter regex requires a real TLD.
const DOMAIN_REGEX = z.core.regexes.domain;

// Parses `SIGNUP_ALLOWED_EMAIL_DOMAINS`: `any` or comma-separated domains.
export const AllowedEmailDomainsSchema = z
  .string()
  .transform((raw, ctx): AllowedEmailDomains => {
    const normalized = raw.trim().toLowerCase();
    if (normalized === ALLOW_ALL) {
      return ALLOW_ALL;
    }

    const domains = normalized
      .split(",")
      .map((domain) => domain.trim())
      .filter((domain) => domain.length > 0);

    if (domains.length === 0 || !domains.every((d) => DOMAIN_REGEX.test(d))) {
      ctx.addIssue({
        code: "custom",
        message: `SIGNUP_ALLOWED_EMAIL_DOMAINS must be '${ALLOW_ALL}' or a non-empty comma-separated list of domains`,
      });
      return z.NEVER;
    }

    return domains;
  });

export function isEmailDomainAllowed(
  email: string,
  allowedEmailDomains: AllowedEmailDomains,
): boolean {
  if (allowedEmailDomains === ALLOW_ALL) {
    return true;
  }

  // Exact match only: `mail.pagopa.it` does not match `pagopa.it`.
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1 || atIndex === email.length - 1) {
    return false;
  }

  const domain = email.slice(atIndex + 1).toLowerCase();
  return allowedEmailDomains.some(
    (allowed) => allowed.toLowerCase() === domain,
  );
}
