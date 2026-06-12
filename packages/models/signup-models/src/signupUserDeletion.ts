import { SignupUserId } from "@knodia/common-models/ids";
import { z } from "zod";

// Registry entry for a completed deletion: the signup_user row is gone and
// only the opaque id plus lifecycle timestamps survive (no PII by design).
export const SignupUserDeletion = z.strictObject({
  deletedAt: z.coerce.date(),
  deletionRequestedAt: z.coerce.date(),
  signupCreatedAt: z.coerce.date(),
  signupUserId: SignupUserId,
});
export type SignupUserDeletion = z.infer<typeof SignupUserDeletion>;
