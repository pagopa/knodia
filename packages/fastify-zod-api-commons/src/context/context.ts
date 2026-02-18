import type {
  RequestContext,
  RequestContextData,
} from "@fastify/request-context";
import type { CorrelationId } from "@knodia/common-models/ids";
import type { ServiceName } from "@knodia/common-models/services";

import { genericInternalError } from "@knodia/common-models/errors";
import Fastify from "fastify";

// Documentation: https://github.com/fastify/fastify-request-context#typescript
declare module "@fastify/request-context" {
  interface RequestContextData {
    correlationId: CorrelationId;
    logger: Fastify.FastifyBaseLogger;
    serviceName: ServiceName;
  }
}

export const getContextValues = (
  requestContext: RequestContext,
): RequestContextData => ({
  correlationId: getRequiredContextItem(requestContext, "correlationId"),
  logger: getRequiredContextItem(requestContext, "logger"),
  serviceName: getRequiredContextItem(requestContext, "serviceName"),
});

const getRequiredContextItem = <K extends keyof RequestContextData>(
  requestContext: RequestContext,
  key: K,
): RequestContextData[K] => {
  const value = requestContext.get(key);
  if (!value) {
    throw genericInternalError(`Missing ${key} in request context`);
  }
  return value;
};
