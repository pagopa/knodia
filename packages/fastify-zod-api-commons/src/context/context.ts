import type {
  RequestContext,
  RequestContextData,
} from "@fastify/request-context";
import type { CorrelationId } from "@knodia/common-models/ids";
import type { AuthData } from "@knodia/common-models/tokenCodecs";

import { genericInternalError } from "@knodia/common-models/errors";
import Fastify from "fastify";

// Documentation: https://github.com/fastify/fastify-request-context#typescript
declare module "@fastify/request-context" {
  interface RequestContextData {
    authData?: AuthData;
    correlationId: CorrelationId;
    logger: Fastify.FastifyBaseLogger;
    serviceName: string;
  }
}

export const getContextValues = (
  requestContext: RequestContext,
): RequestContextData => ({
  authData: requestContext.get("authData"),
  correlationId: getRequiredContextItem(requestContext, "correlationId"),
  logger: getRequiredContextItem(requestContext, "logger"),
  serviceName: getRequiredContextItem(requestContext, "serviceName"),
});

export const getAuthData = (requestContext: RequestContext): AuthData => {
  const authData = requestContext.get("authData");
  if (!authData) {
    throw genericInternalError("Missing authData in request context");
  }
  return authData;
};

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
