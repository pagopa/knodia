import openapiZodPlugin from "@knodia/fastify-zod-api-commons/openApiZodPlugin";
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
      termsOfService: "https://github.com/pagopa/knodia",
      title: "Knodia E-service Process API",
      version: "1.0.0",
    },
    servers: [{ description: "E-service Process API", url: "/" }],
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
