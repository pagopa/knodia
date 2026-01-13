import openapiZodPlugin from "@knodia/fastify-plugin-openapi-zod";
import Fastify from "fastify";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

const app = Fastify({
  logger: true, // TODO configure logger - winston? pino?
});

export const clients = getKnodiaClients();

// openapiPlugin must be registered before any routes to ensure proper route discovery
app.register(openapiZodPlugin, {
  openapi: {
    info: {
      description: "API for managing Knodia BFF",
      title: "Knodia BFF API",
      version: "1.0.0",
    },
  },
  openapiDocs: {
    routePrefix: "/docs",
  },
});

app.register(eserviceRouter, clients.eserviceProcessClient);

export default app;
