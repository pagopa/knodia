import openapiZodPlugin from "@knodia/fastify-zod-api-commons/openApiZodPlugin";
import Fastify from "fastify";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

const app = Fastify({
  logger: true, // TODO configure logger - winston? pino?
});

const clients = getKnodiaClients();

// openapiPlugin must be registered before any routes to ensure proper route discovery
app.register(openapiZodPlugin, {
  openapi: {
    info: {
      contact: {
        url: "https://github.com/pagopa/knodia/issues",
      },
      description: "Knodia backend-for-frontend API",
      termsOfService: "https://github.com/pagopa/knodia",
      title: "Knodia BFF API",
      version: "1.0.0",
    },
    servers: [{ description: "BFF API", url: "/" }],
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

app.register(eserviceRouter, clients.eserviceProcessClient);

export default app;
