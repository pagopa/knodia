import type { CorrelationId } from "@knodia/common-models/ids";
import type { InternalToken } from "@knodia/token-generator/models";

import {
  AUTHORIZATION_HEADER,
  CORRELATION_ID_HEADER,
} from "@knodia/common-models/headers";

export const getKnodiaServiceHeaders = (
  correlationId: CorrelationId,
  token: InternalToken,
) => ({
  [AUTHORIZATION_HEADER]: `Bearer ${token.serialized}`,
  [CORRELATION_ID_HEADER]: correlationId,
});
