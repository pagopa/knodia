import type { CorrelationId } from "@knodia/common-models/ids";
import type { FastifyRequest } from "fastify";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";

export const getProcessHeaders = (
  req: FastifyRequest,
  correlationId: CorrelationId,
) => ({
  Authorization: req.headers.authorization,
  [CORRELATION_ID_HEADER]: correlationId,
});
