import type { ServiceName } from "@knodia/common-models";

import fastifyRequestContext from "@fastify/request-context";
import openapiZodPlugin from "@knodia/fastify-plugin-openapi-zod";
import Fastify from "fastify";

export const createFastifyClient = (
  serviceName: ServiceName,
  openapiInfo: {
    description: string;
    title: string;
    version: string;
  },
) => {
  const app = Fastify({
    logger: true, // TODO configure logger - winston? pino?
  });

  // openapiPlugin must be registered before any routes to ensure proper route discovery
  app.register(openapiZodPlugin, {
    openapi: {
      info: openapiInfo,
    },
    openapiDocs: {
      routePrefix: "/docs",
    },
  });
  app.register(fastifyRequestContext, {
    defaultStoreValues: (request) => ({
      correlationId:
        request.headers["x-correlation-id"]?.toString() ?? crypto.randomUUID(),
      logger: request.log,
      serviceName,
    }),
  });

  return app;
};
