import z from "zod";

export const OIDC_SESSION_COOKIE_NAME = "oidc-session";

export const OidcSessionCookieData = z.object({
  nonce: z.string(),
  state: z.string(),
});

export type OidcSessionCookieData = z.infer<typeof OidcSessionCookieData>;

export const API_OIDCCallbackQuery = z.object({
  code: z.string(),
  state: z.string(),
});

export const API_SessionResponse = z
  .strictObject({
    uiSignupSessionToken: z.string(),
  })
  .meta({ id: "SessionResponse" });

export const API_OIDCSessionCookie = z.object({
  [OIDC_SESSION_COOKIE_NAME]: z.string().optional().meta({
    description:
      "HttpOnly cookie carrying the OIDC state and nonce (set by /auth/oidc/start)",
  }),
});

export const API_ConfirmOnboardingRequestBody = z
  .strictObject({
    email: z.email(),
  })
  .meta({ id: "ConfirmOnboardingRequestBody" });

export type API_ConfirmOnboardingRequestBody = z.infer<
  typeof API_ConfirmOnboardingRequestBody
>;

export const API_ChangeEmailRequestBody = z
  .strictObject({
    email: z.email(),
  })
  .meta({ id: "ChangeEmailRequestBody" });

export type API_ChangeEmailRequestBody = z.infer<
  typeof API_ChangeEmailRequestBody
>;

const API_SuspensionReason = z.enum([
  "AccuracyContested",
  "UnlawfulProcessing",
  "DataNeededForLegalClaims",
  "PendingObjectionVerification",
]);
type API_SuspensionReason = z.infer<typeof API_SuspensionReason>;

export const API_SuspendUserRequestBody = z
  .strictObject({
    reason: API_SuspensionReason,
  })
  .meta({ id: "SuspendUserRequestBody" });

export type API_SuspendUserRequestBody = z.infer<
  typeof API_SuspendUserRequestBody
>;

export const API_OnboardingStatus = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "DELETION_PENDING",
  "NOT_COMPLETED",
]);
export type API_OnboardingStatus = z.infer<typeof API_OnboardingStatus>;

export const API_CurrentSignupUser = z
  .strictObject({
    email: z.email().optional(),
    onboardingStatus: API_OnboardingStatus,
  })
  .meta({ id: "CurrentSignupUser" });
export type API_CurrentSignupUser = z.infer<typeof API_CurrentSignupUser>;
