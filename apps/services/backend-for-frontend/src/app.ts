import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { config } from "./config/config.ts";
import { apiTags } from "./models/apiTags.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

const clients = getKnodiaClients();

const app = createFastifyApp({
  fastifyOptions: {
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
  },
  loggerConfig: config,
  readCorrelationIdFromHeader: false,
  serviceName: config.serviceName,
});

app.register(healthRouter);
app.register(eserviceRouter, clients.eserviceProcessClient);

export default app;
