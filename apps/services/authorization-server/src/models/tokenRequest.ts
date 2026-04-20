import { ConsumerKeychainId } from "@knodia/common-models/ids";
import z from "zod";

import {
  EXPECTED_CLIENT_ASSERTION_TYPE,
  EXPECTED_GRANT_TYPE,
} from "./constants.ts";

export const TokenRequest = z.strictObject({
  client_assertion: z.jwt(),
  client_assertion_type: z.literal(EXPECTED_CLIENT_ASSERTION_TYPE),
  client_id: ConsumerKeychainId,
  grant_type: z.literal(EXPECTED_GRANT_TYPE),
});
export type TokenRequest = z.infer<typeof TokenRequest>;
