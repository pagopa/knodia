import { Algorithm } from "@knodia/common-models/crypto";
import {
  ConsumerKeychainId,
  KeyId,
  PurposeId,
} from "@knodia/common-models/ids";
import z from "zod";

export const EXPECTED_CLIENT_ASSERTION_ALGORITHM = Algorithm.enum.RS256;
export const EXPECTED_CLIENT_ASSERTION_TYP = "JWT";

const ClientAssertionHeader = z.strictObject({
  alg: z.literal(EXPECTED_CLIENT_ASSERTION_ALGORITHM),
  kid: KeyId,
  typ: z.literal(EXPECTED_CLIENT_ASSERTION_TYP),
});
export type ClientAssertionHeader = z.infer<typeof ClientAssertionHeader>;

export const ClientAssertionPayload = z
  .strictObject({
    aud: z.array(z.string()).or(z.string()),
    exp: z.int().positive(),
    iat: z.int().positive(),
    iss: ConsumerKeychainId,
    jti: z.uuid(),
    purpose_id: PurposeId,
    sub: ConsumerKeychainId,
  })
  .transform(({ purpose_id, ...rest }) => ({
    ...rest,
    purposeId: purpose_id,
  }));
export type ClientAssertionPayload = z.infer<typeof ClientAssertionPayload>;
export type ClientAssertionRawPayload = z.input<typeof ClientAssertionPayload>;

export const ClientAssertion = z.strictObject({
  headers: ClientAssertionHeader,
  payload: ClientAssertionPayload,
});
export type ClientAssertion = z.infer<typeof ClientAssertion>;
