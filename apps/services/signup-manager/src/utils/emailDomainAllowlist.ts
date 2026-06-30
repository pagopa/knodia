// `any` disables the gate (used locally and once onboarding opens to everyone).
export const ALLOW_ALL = "any";

export type AllowedEmailDomains = string[] | typeof ALLOW_ALL;

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

  return allowedEmailDomains.includes(email.slice(atIndex + 1).toLowerCase());
}
