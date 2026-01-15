import { registerErrorHandler, serviceName } from "@knodia/error-commons";
import openapiZodPlugin from "@knodia/fastify-plugin-openapi-zod";
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
      description: "Knodia backend-for-frontend API",
      title: "Knodia BFF API",
      version: "1.0.0",
    },
  },
  openapiDocs: {
    routePrefix: "/docs",
  },
});

app.register(eserviceRouter, clients.eserviceProcessClient);
registerErrorHandler(app, {
  correlationId: "TODO", // TODO: implement correlation ID generation
  logger: app.log,
  serviceName: serviceName.BACKEND_FOR_FRONTEND,
});

export default app;
