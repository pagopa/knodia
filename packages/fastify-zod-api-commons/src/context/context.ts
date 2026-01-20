import type { RequestContext } from "@fastify/request-context";
import type { ServiceName } from "@knodia/common-models";

import Fastify from "fastify";

// Documentation: https://github.com/fastify/fastify-request-context#typescript
declare module "@fastify/request-context" {
  interface RequestContextData {
    correlationId: string;
    logger: Fastify.FastifyBaseLogger;
    serviceName: ServiceName;
  }
}

export const getContextValues = (requestContext: RequestContext) => ({
  correlationId:
    requestContext.get("correlationId") ||
    (() => {
      throw new Error("Missing correlationId in request context");
    })(),
  logger:
    requestContext.get("logger") ||
    (() => {
      throw new Error("Missing logger in request context");
    })(),
  serviceName:
    requestContext.get("serviceName") ||
    (() => {
      throw new Error("Missing serviceName in request context");
    })(),
});
