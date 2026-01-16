import type { ServiceName } from "@knodia/common-models";

import fastifyRequestContext from "@fastify/request-context";
import openapiZodPlugin from "@knodia/fastify-plugin-openapi-zod";
import Fastify from "fastify";

export const createFastifyClient = (serviceName: ServiceName) => {
  const app = Fastify({
    logger: true, // TODO configure logger - winston? pino?
  });

  // openapiPlugin must be registered before any routes to ensure proper route discovery
  app.register(openapiZodPlugin, {
    openapi: {
      info: {
        description: "API for managing Knodia E-services",
        title: "Knodia E-service Process API",
        version: "1.0.0",
      },
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
