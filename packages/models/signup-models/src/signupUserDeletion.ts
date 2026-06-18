import { SignupUserId } from "@knodia/common-models/ids";
import { z } from "zod";

// Registry entry for a completed deletion: the signup_user row is gone and
// only the opaque id plus the erasure timestamp survive (no PII by design) —
// enough to prove the erasure act without retaining data about the subject.
export const SignupUserDeletion = z.strictObject({
  deletedAt: z.coerce.date(),
  signupUserId: SignupUserId,
});
export type SignupUserDeletion = z.infer<typeof SignupUserDeletion>;
