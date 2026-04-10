import { ConsumerKeychainId, PurposeId } from "@knodia/common-models/ids";
import z from "zod";

import {
  ALLOWED_CLIENT_ASSERTION_ALGORITHM,
  ALLOWED_CLIENT_ASSERTION_TYP,
} from "./constants.ts";

export const ClientAssertionHeader = z.strictObject({
  alg: z.literal(ALLOWED_CLIENT_ASSERTION_ALGORITHM),
  kid: z.base64url(),
  typ: z.literal(ALLOWED_CLIENT_ASSERTION_TYP),
});
export type ClientAssertionHeader = z.infer<typeof ClientAssertionHeader>;

export const ClientAssertionPayload = z.strictObject({
  aud: z.array(z.string()).or(z.string()),
  exp: z.int().positive(),
  iat: z.int().positive(),
  iss: ConsumerKeychainId,
  jti: z.uuid(),
  purpose_id: PurposeId.optional(),
  sub: ConsumerKeychainId,
});
export type ClientAssertionPayload = z.infer<typeof ClientAssertionPayload>;

export const ClientAssertion = z.strictObject({
  header: ClientAssertionHeader,
  payload: ClientAssertionPayload,
});
export type ClientAssertion = z.infer<typeof ClientAssertion>;
