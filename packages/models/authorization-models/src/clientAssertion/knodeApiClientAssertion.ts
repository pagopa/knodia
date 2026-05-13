import { KeyId, KnodeApiKeychainId, KnodeId } from "@knodia/common-models/ids";
import z from "zod";

import {
  EXPECTED_CLIENT_ASSERTION_ALGORITHM,
  EXPECTED_CLIENT_ASSERTION_TYP,
} from "./clientAssertion.ts";

const KnodeApiClientAssertionHeader = z.strictObject({
  alg: z.literal(EXPECTED_CLIENT_ASSERTION_ALGORITHM),
  kid: KeyId,
  typ: z.literal(EXPECTED_CLIENT_ASSERTION_TYP),
});
export type KnodeApiClientAssertionHeader = z.infer<
  typeof KnodeApiClientAssertionHeader
>;

const KnodeApiClientAssertionPayload = z
  .strictObject({
    aud: z.array(z.string()).or(z.string()),
    exp: z.int().positive(),
    iat: z.int().positive(),
    iss: KnodeApiKeychainId,
    jti: z.uuid(),
    knode_id: KnodeId,
    sub: KnodeApiKeychainId,
  })
  .transform(({ knode_id, ...rest }) => ({
    ...rest,
    knodeId: knode_id,
  }));
export type KnodeApiClientAssertionRawPayload = z.input<
  typeof KnodeApiClientAssertionPayload
>;
type KnodeApiClientAssertionPayload = z.infer<
  typeof KnodeApiClientAssertionPayload
>;

export const KnodeApiClientAssertion = z.strictObject({
  headers: KnodeApiClientAssertionHeader,
  payload: KnodeApiClientAssertionPayload,
});
export type KnodeApiClientAssertion = z.infer<typeof KnodeApiClientAssertion>;
