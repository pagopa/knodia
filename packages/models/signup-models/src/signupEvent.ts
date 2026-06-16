import { EmailChangeRequestId, SignupUserId } from "@knodia/common-models/ids";
import { z } from "zod";

export const OnboardingCompletedV1 = z.object({
  data: z.strictObject({
    occurredAt: z.iso.datetime(),
    oneIdNonce: z.string(),
    signupUserId: SignupUserId,
    // Onboarding-only: future action variants (suspension, deletion) carry
    // occurredAt + oneIdNonce + signupUserId but not the T&C consent fields.
    termsAcceptanceDigest: z.string().regex(/^[0-9a-f]{64}$/),
    termsAcceptanceVersion: z.string(),
  }),
  type: z.literal("OnboardingCompletedV1"),
});
export type OnboardingCompletedV1 = z.infer<typeof OnboardingCompletedV1>;

export const EmailChangeRequestedV1 = z.object({
  data: z.strictObject({
    emailChangeRequestId: EmailChangeRequestId,
    signupUserId: SignupUserId,
  }),
  type: z.literal("EmailChangeRequestedV1"),
});
export type EmailChangeRequestedV1 = z.infer<typeof EmailChangeRequestedV1>;

export const SignupEventV1 = z.discriminatedUnion("type", [
  OnboardingCompletedV1,
  EmailChangeRequestedV1,
]);
export type SignupEventV1 = z.infer<typeof SignupEventV1>;
