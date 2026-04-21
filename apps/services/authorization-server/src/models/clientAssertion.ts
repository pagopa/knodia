import {
  ConsumerKeychainId,
  KeyId,
  PurposeId,
} from "@knodia/common-models/ids";
import z from "zod";

import {
  EXPECTED_CLIENT_ASSERTION_ALGORITHM,
  EXPECTED_CLIENT_ASSERTION_TYP,
} from "./constants.ts";

const ClientAssertionHeader = z.strictObject({
  alg: z.literal(EXPECTED_CLIENT_ASSERTION_ALGORITHM),
  kid: KeyId,
  typ: z.literal(EXPECTED_CLIENT_ASSERTION_TYP),
});

const ClientAssertionPayload = z
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

export const ClientAssertion = z.strictObject({
  header: ClientAssertionHeader,
  payload: ClientAssertionPayload,
});
export type ClientAssertion = z.infer<typeof ClientAssertion>;
