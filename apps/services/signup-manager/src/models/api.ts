import { KnodeId } from "@knodia/common-models/ids";
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

export const API_SuspensionReason = z.enum([
  "ACCURACY_CONTESTED",
  "UNLAWFUL_PROCESSING",
  "DATA_NEEDED_FOR_LEGAL_CLAIMS",
  "PENDING_OBJECTION_VERIFICATION",
]);
export type API_SuspensionReason = z.infer<typeof API_SuspensionReason>;

export const API_SuspendUserRequestBody = z
  .strictObject({
    suspensionReason: API_SuspensionReason,
  })
  .meta({ id: "SuspendUserRequestBody" });

export type API_SuspendUserRequestBody = z.infer<
  typeof API_SuspendUserRequestBody
>;

export const API_SignupUserIdPathParam = z.strictObject({
  signupUserId: z.uuid(),
});

export type API_SignupUserIdPathParam = z.infer<
  typeof API_SignupUserIdPathParam
>;

export const API_OnboardingStatus = z.enum([
  "ONBOARDING_PENDING",
  "ACTIVE",
  "SUSPENDED",
  "DELETION_PENDING",
  "NOT_COMPLETED",
]);
export type API_OnboardingStatus = z.infer<typeof API_OnboardingStatus>;

export const API_KnodeAssignment = z
  .strictObject({
    knode: KnodeId,
    organizationName: z.string(),
    username: z.string(),
  })
  .meta({ id: "KnodeAssignment" });
export type API_KnodeAssignment = z.infer<typeof API_KnodeAssignment>;

const API_NotCompletedSignupUser = z.strictObject({
  onboardingStatus: API_OnboardingStatus.extract(["NOT_COMPLETED"]),
});

const API_OnboardingPendingSignupUser = z.strictObject({
  email: z.email(),
  onboardingStatus: API_OnboardingStatus.extract(["ONBOARDING_PENDING"]),
  termsAcceptedAt: z.iso.datetime(),
});

export const API_OnboardedStatus = API_OnboardingStatus.extract([
  "ACTIVE",
  "SUSPENDED",
  "DELETION_PENDING",
]);
export type API_OnboardedStatus = z.infer<typeof API_OnboardedStatus>;

const API_OnboardedSignupUser = z.strictObject({
  email: z.email(),
  knodes: z.array(API_KnodeAssignment),
  onboardingStatus: API_OnboardedStatus,
  termsAcceptedAt: z.iso.datetime(),
});

export const API_CurrentSignupUser = z
  .discriminatedUnion("onboardingStatus", [
    API_NotCompletedSignupUser,
    API_OnboardingPendingSignupUser,
    API_OnboardedSignupUser,
  ])
  .meta({ id: "CurrentSignupUser" });
export type API_CurrentSignupUser = z.infer<typeof API_CurrentSignupUser>;
