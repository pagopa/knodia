import { EmailChangeRequestId, SignupUserId } from "@knodia/common-models/ids";
import z from "zod";

export const EmailChangeRequest = z.strictObject({
  createdAt: z.coerce.date(),
  email: z.email(),
  emailChangeRequestId: EmailChangeRequestId,
  signupUserId: SignupUserId,
});
export type EmailChangeRequest = z.infer<typeof EmailChangeRequest>;
