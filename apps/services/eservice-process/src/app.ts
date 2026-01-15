import { registerErrorHandler } from "@knodia/error-commons";
import openapiZodPlugin from "@knodia/fastify-plugin-openapi-zod";
import Fastify from "fastify";

import { eserviceRouter } from "./routers/eserviceRouter.ts";

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

app.register(eserviceRouter);
registerErrorHandler(app, {
  correlationId: "TODO", // TODO: implement correlation ID generation
  logger: app.log,
  serviceName: "eservice-process",
});

export default app;
