import { ConsumerKeychainId, PurposeId } from "@knodia/common-models/ids";
import z from "zod";

export const ClientAssertionHeader = z.strictObject({
  alg: z.string(),
  kid: z.string(),
  typ: z.string().optional(),
});
export type ClientAssertionHeader = z.infer<typeof ClientAssertionHeader>;

export const ClientAssertionPayload = z.strictObject({
  aud: z.array(z.string()).or(z.string()),
  exp: z.number(),
  iat: z.number(),
  iss: ConsumerKeychainId,
  jti: z.string(),
  purposeId: PurposeId.optional(),
  sub: ConsumerKeychainId,
});
export type ClientAssertionPayload = z.infer<typeof ClientAssertionPayload>;

export const ClientAssertion = z.strictObject({
  header: ClientAssertionHeader,
  payload: ClientAssertionPayload,
});
export type ClientAssertion = z.infer<typeof ClientAssertion>;
