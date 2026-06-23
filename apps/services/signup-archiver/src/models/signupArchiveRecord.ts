import { z } from "zod";

// Immutable legal-archive record written to S3. Kept local to signup-archiver:
// it is an archiver-internal contract, so it must not be shared via
// @knodia/signup-models. It deliberately carries no One Identity id: the user
// can be traced back through the clientId:nonce pair.
export const SignupArchiveRecord = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("Onboarding"),
    date: z.iso.datetime(),
    nonce: z.string(),
    termsAcceptanceDigest: z.string().regex(/^[0-9a-f]{64}$/),
    termsAcceptanceVersion: z.string(),
  }),
  z.strictObject({
    action: z.literal("Deletion"),
    date: z.iso.datetime(),
    nonce: z.string(),
  }),
  z.strictObject({
    action: z.literal("Suspension"),
    date: z.iso.datetime(),
    nonce: z.string(),
    suspensionReason: z.string(),
  }),
]);
export type SignupArchiveRecord = z.infer<typeof SignupArchiveRecord>;
