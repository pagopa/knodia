import type { CorrelationId } from "@knodia/common-models/ids";
import type { InternalToken } from "@knodia/token-generator/models";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";

export const getKnodiaServiceHeaders = (
  correlationId: CorrelationId,
  token: InternalToken,
) => ({
  Authorization: `Bearer ${token.serialized}`,
  [CORRELATION_ID_HEADER]: correlationId,
});
