import z from "zod";

export const EmailChangeRequest = z.strictObject({
  createdAt: z.coerce.date(),
  email: z.email(),
  emailChangeRequestId: z.string(),
  signupUserId: z.string(),
});
export type EmailChangeRequest = z.infer<typeof EmailChangeRequest>;
