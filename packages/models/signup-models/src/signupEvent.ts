import { SignupUserId } from "@knodia/common-models/ids";
import { z } from "zod";

export const SignupEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: z.strictObject({ signupUserId: SignupUserId }),
    type: z.literal("OnboardingCompletedV1"),
  }),
]);
export type SignupEventV1 = z.infer<typeof SignupEventV1>;
