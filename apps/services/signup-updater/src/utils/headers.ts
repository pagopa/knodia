import type { CorrelationId } from "@knodia/common-models/ids";
import type { InternalToken } from "@knodia/token-generator/models";

// Inlined to avoid a Fastify dependency in a consumer; these mirror
// AUTHORIZATION_HEADER / CORRELATION_ID_HEADER in @knodia/fastify-zod-api-commons.
const AUTHORIZATION_HEADER = "authorization";
const CORRELATION_ID_HEADER = "x-correlation-id";

export const getKnodiaServiceHeaders = (
  correlationId: CorrelationId,
  token: InternalToken,
) => ({
  [AUTHORIZATION_HEADER]: `Bearer ${token.serialized}`,
  [CORRELATION_ID_HEADER]: correlationId,
});
