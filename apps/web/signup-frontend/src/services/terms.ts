import { type signupManagerApi } from "@knodia/signup-manager-client";
import {
  formatTermsDate,
  getTermsDocument,
  knodiaVersionLabel,
  TERMS_DOCUMENT_VERSION,
  type TermsDocument,
  type TermsLang,
} from "@knodia/terms-and-conditions-models";
import { match, P } from "ts-pattern";

// Same formatter as the backend digest, so displayed and hashed dates stay in sync.
export function resolveAcceptanceDate(
  lang: TermsLang,
  isAuthenticated: boolean,
  user: signupManagerApi.CurrentSignupUser | undefined,
): string {
  // No known acceptance date yet (logged out, or session loading/errored): neutral placeholder.
  if (!isAuthenticated || !user)
    return lang === "it" ? "dell'accettazione" : "the date of acceptance";

  return match(user)
    .with({ onboardingStatus: "NOT_COMPLETED" }, () =>
      formatTermsDate(new Date(), lang),
    )
    .with({ termsAcceptedAt: P.string }, (u) =>
      formatTermsDate(new Date(u.termsAcceptedAt), lang),
    )
    .exhaustive();
}

// Fetch-or-throw: a missing label for the current version is a build error, not a runtime state.
export function retrieveKnodiaVersionLabel(): string {
  const label = knodiaVersionLabel();
  if (label === undefined) {
    throw new Error(`No T&C document for version ${TERMS_DOCUMENT_VERSION}`);
  }
  return label;
}

// Fetch-or-throw: a missing document for the current version is a build error, not a runtime state.
export function retrieveTermsDocument(lang: TermsLang): TermsDocument {
  const document = getTermsDocument(lang);
  if (!document) {
    throw new Error(`No T&C document for version ${TERMS_DOCUMENT_VERSION}`);
  }
  return document;
}
