import openapiZodPlugin from "@knodia/fastify-plugin-openapi-zod";
import Fastify from "fastify";

import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { healthRouter } from "./routers/healthRouter.ts";

const app = Fastify({
  logger: true, // TODO configure logger - winston? pino?
});

// openapiPlugin must be registered before any routes to ensure proper route discovery
app.register(openapiZodPlugin, {
  openapi: {
    info: {
      contact: {
        url: "https://github.com/pagopa/knodia/issues",
      },
      description: "API for managing Knodia E-services",
      title: "Knodia E-service Process API",
      version: "1.0.0",
    },
    tags: [
      {
        description: "Health check routes",
        name: "health",
      },
      {
        description: "E-services routes",
        name: "eservice",
      },
    ],
  },
  openapiDocs: {
    routePrefix: "/docs",
  },
});

app.register(healthRouter);
app.register(eserviceRouter);

export default app;
