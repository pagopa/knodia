import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import openapiZodPlugin from "@knodia/fastify-zod-api-commons/openApiZodPlugin";
import Fastify from "fastify";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
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
    servers: [{ description: "BFF API", url: "/" }],
    tags: [
      healthRouterTag,
      {
        description: "E-services routes",
        name: apiTags.eservice,
      },
    ],
  },
  openapiDocs: {
    routePrefix: "/docs",
  },
});

app.register(healthRouter);
app.register(eserviceRouter, clients.eserviceProcessClient);

export default app;
