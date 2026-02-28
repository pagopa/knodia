import type {
  RequestContext,
  RequestContextData,
} from "@fastify/request-context";
import type { CorrelationId } from "@knodia/common-models/ids";

import { genericInternalError } from "@knodia/common-models/errors";
import { type FastifyBaseLogger } from "fastify";

import type { AuthData } from "../auth/authData.ts";

// Documentation: https://github.com/fastify/fastify-request-context#typescript
declare module "@fastify/request-context" {
  interface RequestContextData {
    authData?: AuthData;
    correlationId: CorrelationId;
    logger: FastifyBaseLogger;
  }
}

export interface AppContext<A extends AuthData = AuthData> {
  authData: A;
  correlationId: CorrelationId;
  logger: FastifyBaseLogger;
}

export const getContextValues = (
  requestContext: RequestContext,
): RequestContextData => ({
  authData: requestContext.get("authData"),
  correlationId: getRequiredContextItem(requestContext, "correlationId"),
  logger: getRequiredContextItem(requestContext, "logger"),
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
