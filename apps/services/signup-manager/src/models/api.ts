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
