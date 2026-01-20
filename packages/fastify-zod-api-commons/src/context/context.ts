import type {
  RequestContext,
  RequestContextData,
} from "@fastify/request-context";

import Fastify from "fastify";

import type { ServiceName } from "../models/errors/services.ts";

// Documentation: https://github.com/fastify/fastify-request-context#typescript
declare module "@fastify/request-context" {
  interface RequestContextData {
    correlationId: string;
    logger: Fastify.FastifyBaseLogger;
    serviceName: ServiceName;
  }
}

export const getContextValues = (requestContext: RequestContext) => ({
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
    throw new Error(`Missing ${key} in request context`);
  }
  return value;
};
