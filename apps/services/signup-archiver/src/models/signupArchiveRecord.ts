import { z } from "zod";

// Immutable legal-archive record written to S3. Kept local to signup-archiver:
// it carries oneIdentityId (personal data) and is an archiver-internal contract,
// so it must not be shared via @knodia/signup-models.
export const SignupArchiveRecord = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("Onboarding"),
    date: z.iso.datetime(),
    nonce: z.string(),
    oneIdentityId: z.string().min(1),
    termsAcceptanceDigest: z.string().regex(/^[0-9a-f]{64}$/),
    termsAcceptanceVersion: z.string(),
  }),
]);
export type SignupArchiveRecord = z.infer<typeof SignupArchiveRecord>;
