import type { CorrelationId } from "@knodia/common-models/ids";
import type { FastifyRequest } from "fastify";

import {
  AUTHORIZATION_HEADER,
  CORRELATION_ID_HEADER,
} from "@knodia/fastify-zod-api-commons/models";

export const getKnodiaServiceHeaders = (
  req: FastifyRequest,
  correlationId: CorrelationId,
) => ({
  [AUTHORIZATION_HEADER]: req.headers.authorization,
  [CORRELATION_ID_HEADER]: correlationId,
});
